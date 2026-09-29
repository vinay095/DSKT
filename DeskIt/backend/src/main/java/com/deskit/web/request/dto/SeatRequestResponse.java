package com.deskit.web.request.dto;

import com.deskit.domain.SeatRequest;
import java.time.Instant;
import java.util.UUID;

public record SeatRequestResponse(
        UUID id,
        String empId,
        String requestedDeskId,
        String floorId,
        String officeId,
        SeatRequest.Status status,
        String notes,
        String reviewedBy,
        Instant reviewedAt,
        Instant createdAt
) {
    public static SeatRequestResponse from(SeatRequest request) {
        return new SeatRequestResponse(
                request.getId(),
                request.getEmpId(),
                request.getRequestedDeskId(),
                request.getFloorId(),
                request.getOfficeId(),
                request.getStatus(),
                request.getNotes(),
                request.getReviewedBy(),
                request.getReviewedAt(),
                request.getCreatedAt()
        );
    }
}
