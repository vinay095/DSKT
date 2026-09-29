package com.deskit.web.request.dto;

import com.deskit.domain.FloorChangeRequest;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CreateFloorChangeRequestBody(
        @NotNull @JsonAlias({"request_type", "type"}) FloorChangeRequest.RequestType requestType,
        @NotBlank @JsonAlias({"element_description", "elementDescription", "description"}) String elementDescription,
        @NotBlank String details,
        @JsonAlias({"floor_id"}) String floorId
) {
}
