package com.deskit.web.org.dto;

import jakarta.validation.constraints.NotBlank;

public record CloneFloorRequest(
        @NotBlank String label,
        @NotBlank String shortLabel,
        String officeId,
        String locationLabel
) {
}
