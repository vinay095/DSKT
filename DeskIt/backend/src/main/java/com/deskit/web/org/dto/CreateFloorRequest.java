package com.deskit.web.org.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateFloorRequest(
        @NotBlank String officeId,
        @NotBlank String label,
        @NotBlank String shortLabel,
        @NotBlank String locationLabel,
        String block,
        String building
) {
}
