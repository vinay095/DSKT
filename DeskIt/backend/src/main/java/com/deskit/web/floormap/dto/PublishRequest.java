package com.deskit.web.floormap.dto;

import com.deskit.domain.PublishTarget;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotNull;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PublishRequest(
        @NotNull PublishTarget target
) {
}
