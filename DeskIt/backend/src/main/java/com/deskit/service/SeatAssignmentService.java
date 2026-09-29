package com.deskit.service;

import com.deskit.config.RedisConfig;
import com.deskit.domain.Floor;
import com.deskit.domain.SeatAssignment;
import com.deskit.repository.EmployeeRepository;
import com.deskit.repository.SeatAssignmentRepository;
import com.deskit.security.DeskItPrincipal;
import com.deskit.web.assignment.dto.AssignSeatRequest;
import com.deskit.web.assignment.dto.SeatAssignmentResponse;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SeatAssignmentService {

    private final SeatAssignmentRepository seatAssignmentRepository;
    private final EmployeeRepository employeeRepository;
    private final FloorService floorService;
    private final AuditService auditService;

    public SeatAssignmentService(
            SeatAssignmentRepository seatAssignmentRepository,
            EmployeeRepository employeeRepository,
            FloorService floorService,
            AuditService auditService
    ) {
        this.seatAssignmentRepository = seatAssignmentRepository;
        this.employeeRepository = employeeRepository;
        this.floorService = floorService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = RedisConfig.CACHE_ASSIGNMENTS, key = "'floor:' + #floorId")
    public List<SeatAssignmentResponse> listByFloor(String floorId) {
        floorService.requireActiveFloor(floorId);
        return seatAssignmentRepository
                .findByFloorIdAndStatusOrderByAssignedAtDesc(floorId, SeatAssignment.Status.active)
                .stream()
                .map(SeatAssignmentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = RedisConfig.CACHE_ASSIGNMENTS, key = "'emp:' + #empId")
    public List<SeatAssignmentResponse> listByEmployee(String empId) {
        requireEmployee(empId);
        return seatAssignmentRepository
                .findByEmpIdAndStatusOrderByAssignedAtDesc(empId, SeatAssignment.Status.active)
                .stream()
                .map(SeatAssignmentResponse::from)
                .toList();
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(cacheNames = RedisConfig.CACHE_ASSIGNMENTS, allEntries = true)
    })
    public SeatAssignmentResponse assign(String floorId, AssignSeatRequest request) {
        Floor floor = floorService.requireActiveFloor(normalizeFloorRef(floorId));
        String resolvedFloorId = floor.getId();
        requireEmployee(request.empId());

        ResolvedDesk desk = resolveDesk(request);
        seatAssignmentRepository
                .findByFloorIdAndDeskCodeAndStatus(resolvedFloorId, desk.code(), SeatAssignment.Status.active)
                .ifPresent(existing -> {
                    SeatAssignmentResponse before = SeatAssignmentResponse.from(existing);
                    existing.revoke();
                    seatAssignmentRepository.saveAndFlush(existing);
                    auditService.record(
                            "SEAT_UNASSIGN",
                            "seat_assignment",
                            existing.getAssignmentId().toString(),
                            before,
                            SeatAssignmentResponse.from(existing)
                    );
                });

        boolean temporary = Boolean.TRUE.equals(request.temporary())
                || request.assignmentType() == SeatAssignment.AssignmentType.temporary;
        SeatAssignment.AssignmentType type = request.assignmentType() == null
                ? (temporary ? SeatAssignment.AssignmentType.temporary : SeatAssignment.AssignmentType.permanent)
                : request.assignmentType();

        if (temporary && request.endDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Temporary assignments require endDate");
        }

        SeatAssignment created = SeatAssignment.create(
                resolvedFloorId,
                floor.getActivePublishedMapId(),
                desk.code(),
                desk.objectId(),
                request.empId().trim(),
                type,
                temporary,
                request.startDate(),
                request.endDate(),
                blankToNull(request.notes()),
                currentEmpId()
        );
        SeatAssignment saved = seatAssignmentRepository.save(created);
        SeatAssignmentResponse after = SeatAssignmentResponse.from(saved);
        auditService.record("SEAT_ASSIGN", "seat_assignment", saved.getAssignmentId().toString(), null, after);
        return after;
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(cacheNames = RedisConfig.CACHE_ASSIGNMENTS, allEntries = true)
    })
    public void unassign(String floorId, String deskRef) {
        String resolvedFloorId = floorService.requireActiveFloor(normalizeFloorRef(floorId)).getId();
        SeatAssignment existing = findActiveByDeskRef(resolvedFloorId, deskRef)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No active assignment for desk " + deskRef
                ));
        SeatAssignmentResponse before = SeatAssignmentResponse.from(existing);
        existing.revoke();
        seatAssignmentRepository.save(existing);
        auditService.record(
                "SEAT_UNASSIGN",
                "seat_assignment",
                existing.getAssignmentId().toString(),
                before,
                SeatAssignmentResponse.from(existing)
        );
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(cacheNames = RedisConfig.CACHE_ASSIGNMENTS, allEntries = true)
    })
    public int expireDueTemporaryAssignments() {
        List<SeatAssignment> due = seatAssignmentRepository.findByStatusAndTemporaryTrueAndEndDateBefore(
                SeatAssignment.Status.active,
                Instant.now()
        );
        for (SeatAssignment assignment : due) {
            SeatAssignmentResponse before = SeatAssignmentResponse.from(assignment);
            assignment.expire();
            seatAssignmentRepository.save(assignment);
            auditService.record(
                    "SEAT_EXPIRE",
                    "seat_assignment",
                    assignment.getAssignmentId().toString(),
                    before,
                    SeatAssignmentResponse.from(assignment)
            );
        }
        return due.size();
    }

    /**
     * Path may be a floor id ({@code floor-4}) or a published map id ({@code fmap-pub-floor-4}).
     * Legacy UI sometimes sent {@code floor_map_id: floorPlan.id} where id was the floor id.
     */
    private String normalizeFloorRef(String floorRef) {
        if (floorRef == null || floorRef.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "floorId is required");
        }
        String trimmed = floorRef.trim();
        if (trimmed.startsWith("fmap-pub-")) {
            return trimmed.substring("fmap-pub-".length());
        }
        if (trimmed.startsWith("fmap-draft-")) {
            return trimmed.substring("fmap-draft-".length());
        }
        return trimmed;
    }

    private ResolvedDesk resolveDesk(AssignSeatRequest request) {
        String code = blankToNull(request.deskCode());
        String objectId = blankToNull(request.deskObjectId());
        String deskId = blankToNull(request.deskId());

        if (code == null && deskId != null) {
            // deskId may be a human code (A-101) or creator objectId
            if (deskId.contains("-") && deskId.length() <= 16 && Character.isLetter(deskId.charAt(0))) {
                code = deskId;
            } else {
                objectId = objectId == null ? deskId : objectId;
                code = deskId;
            }
        }
        if (code == null && objectId != null) {
            code = objectId;
        }
        if (code == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provide deskCode, deskObjectId, or deskId");
        }
        return new ResolvedDesk(code, objectId);
    }

    private Optional<SeatAssignment> findActiveByDeskRef(String floorId, String deskRef) {
        String ref = deskRef.trim();
        Optional<SeatAssignment> byCode = seatAssignmentRepository
                .findByFloorIdAndDeskCodeAndStatus(floorId, ref, SeatAssignment.Status.active);
        if (byCode.isPresent()) {
            return byCode;
        }
        return seatAssignmentRepository
                .findByFloorIdAndDeskObjectIdAndStatus(floorId, ref, SeatAssignment.Status.active);
    }

    private void requireEmployee(String empId) {
        employeeRepository.findByEmpIdAndActiveTrue(empId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found: " + empId));
    }

    private static String currentEmpId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof DeskItPrincipal principal) {
            return principal.getEmpId();
        }
        return null;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private record ResolvedDesk(String code, String objectId) {
    }
}
