package com.deskit.service;

import com.deskit.domain.SeatRequest;
import com.deskit.repository.EmployeeRepository;
import com.deskit.repository.SeatRequestRepository;
import com.deskit.security.DeskItPrincipal;
import com.deskit.web.request.dto.CreateSeatRequestBody;
import com.deskit.web.request.dto.SeatRequestResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SeatRequestService {

    private final SeatRequestRepository seatRequestRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditService auditService;

    public SeatRequestService(
            SeatRequestRepository seatRequestRepository,
            EmployeeRepository employeeRepository,
            AuditService auditService
    ) {
        this.seatRequestRepository = seatRequestRepository;
        this.employeeRepository = employeeRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<SeatRequestResponse> list(SeatRequest.Status status) {
        List<SeatRequest> requests = status == null
                ? seatRequestRepository.findAllByOrderByCreatedAtDesc()
                : seatRequestRepository.findByStatusOrderByCreatedAtDesc(status);
        return requests.stream().map(SeatRequestResponse::from).toList();
    }

    @Transactional
    public SeatRequestResponse create(CreateSeatRequestBody body) {
        employeeRepository.findByEmpIdAndActiveTrue(body.empId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        SeatRequest created = SeatRequest.create(
                body.empId().trim(),
                blankToNull(body.requestedDeskId()),
                blankToNull(body.floorId()),
                blankToNull(body.officeId()),
                blankToNull(body.notes())
        );
        SeatRequest saved = seatRequestRepository.save(created);
        SeatRequestResponse after = SeatRequestResponse.from(saved);
        auditService.record("SEAT_REQUEST_CREATE", "seat_request", saved.getId().toString(), null, after);
        return after;
    }

    @Transactional
    public SeatRequestResponse review(UUID id, SeatRequest.Status status) {
        if (status == SeatRequest.Status.pending) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status must be approved or rejected");
        }
        SeatRequest request = seatRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Seat request not found"));
        SeatRequestResponse before = SeatRequestResponse.from(request);
        try {
            request.review(status, currentEmpId());
        } catch (IllegalStateException | IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
        SeatRequest saved = seatRequestRepository.save(request);
        SeatRequestResponse after = SeatRequestResponse.from(saved);
        auditService.record("SEAT_REQUEST_REVIEW", "seat_request", saved.getId().toString(), before, after);
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
