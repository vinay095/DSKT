package com.deskit.service;

import com.deskit.domain.FloorChangeRequest;
import com.deskit.repository.FloorChangeRequestRepository;
import com.deskit.security.DeskItPrincipal;
import com.deskit.web.request.dto.CreateFloorChangeRequestBody;
import com.deskit.web.request.dto.FloorChangeRequestResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FloorChangeRequestService {

    private final FloorChangeRequestRepository floorChangeRequestRepository;
    private final FloorService floorService;
    private final AuditService auditService;

    public FloorChangeRequestService(
            FloorChangeRequestRepository floorChangeRequestRepository,
            FloorService floorService,
            AuditService auditService
    ) {
        this.floorChangeRequestRepository = floorChangeRequestRepository;
        this.floorService = floorService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<FloorChangeRequestResponse> list(FloorChangeRequest.Status status) {
        List<FloorChangeRequest> requests = status == null
                ? floorChangeRequestRepository.findAllByOrderByCreatedAtDesc()
                : floorChangeRequestRepository.findByStatusOrderByCreatedAtDesc(status);
        return requests.stream().map(FloorChangeRequestResponse::from).toList();
    }

    @Transactional
    public FloorChangeRequestResponse create(CreateFloorChangeRequestBody body) {
        String empId = currentEmpId();
        if (empId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated employee required");
        }
        if (body.floorId() != null && !body.floorId().isBlank()) {
            floorService.requireActiveFloor(body.floorId().trim());
        }

        FloorChangeRequest created = FloorChangeRequest.create(
                empId,
                body.requestType(),
                body.elementDescription().trim(),
                body.details().trim(),
                blankToNull(body.floorId())
        );
        FloorChangeRequest saved = floorChangeRequestRepository.save(created);
        FloorChangeRequestResponse after = FloorChangeRequestResponse.from(saved);
        auditService.record("FLOOR_CHANGE_CREATE", "floor_change_request", saved.getId().toString(), null, after);
        return after;
    }

    @Transactional
    public FloorChangeRequestResponse review(UUID id, FloorChangeRequest.Status status) {
        if (status == FloorChangeRequest.Status.pending) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status must not be pending");
        }
        FloorChangeRequest request = floorChangeRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Floor change request not found"));
        FloorChangeRequestResponse before = FloorChangeRequestResponse.from(request);
        try {
            request.updateStatus(status, currentEmpId());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
        FloorChangeRequest saved = floorChangeRequestRepository.save(request);
        FloorChangeRequestResponse after = FloorChangeRequestResponse.from(saved);
        auditService.record("FLOOR_CHANGE_REVIEW", "floor_change_request", saved.getId().toString(), before, after);
        return after;
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
}
