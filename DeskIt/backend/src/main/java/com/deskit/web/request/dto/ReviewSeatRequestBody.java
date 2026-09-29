package com.deskit.web.request.dto;

import com.deskit.domain.SeatRequest;
import jakarta.validation.constraints.NotNull;

public record ReviewSeatRequestBody(
        @NotNull SeatRequest.Status status
) {
}
