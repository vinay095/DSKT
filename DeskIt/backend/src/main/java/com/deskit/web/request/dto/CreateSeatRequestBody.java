package com.deskit.web.request.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CreateSeatRequestBody(
        @NotBlank @JsonAlias({"emp_id"}) String empId,
        @JsonAlias({"requested_desk_id", "deskId", "desk_id", "deskCode", "desk_code"}) String requestedDeskId,
        @JsonAlias({"floor_id"}) String floorId,
        @JsonAlias({"office_id"}) String officeId,
        String notes
) {
}
