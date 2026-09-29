package com.deskit.web.request.dto;

import com.deskit.domain.FloorChangeRequest;
import java.time.Instant;
import java.util.UUID;

public record FloorChangeRequestResponse(
        UUID id,
        String requestedByEmpId,
        FloorChangeRequest.RequestType requestType,
        String elementDescription,
        String details,
        String floorId,
        FloorChangeRequest.Status status,
        String reviewedBy,
        Instant reviewedAt,
        Instant createdAt
) {
    public static FloorChangeRequestResponse from(FloorChangeRequest request) {
        return new FloorChangeRequestResponse(
                request.getId(),
                request.getRequestedByEmpId(),
                request.getRequestType(),
                request.getElementDescription(),
                request.getDetails(),
                request.getFloorId(),
                request.getStatus(),
                request.getReviewedBy(),
                request.getReviewedAt(),
                request.getCreatedAt()
        );
    }
}
