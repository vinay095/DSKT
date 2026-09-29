package com.deskit.web.request.dto;

import com.deskit.domain.FloorChangeRequest;
import jakarta.validation.constraints.NotNull;

public record ReviewFloorChangeRequestBody(
        @NotNull FloorChangeRequest.Status status
) {
}
