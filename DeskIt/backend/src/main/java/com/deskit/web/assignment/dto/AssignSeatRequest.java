package com.deskit.web.assignment.dto;

import com.deskit.domain.SeatAssignment;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

/**
 * Accepts both Spring camelCase and legacy/Supabase-style snake_case payloads from DeskIt UI.
 * Desk identity may be supplied as {@code deskCode}, {@code deskObjectId}, or {@code deskId}
 * (object id or code — resolved in {@link com.deskit.service.SeatAssignmentService}).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AssignSeatRequest(
        @JsonAlias({"desk_code", "code"}) String deskCode,
        @JsonAlias({"desk_object_id", "objectId", "object_id"}) String deskObjectId,
        /** Frontend often sends desk element id here (objectId or code). */
        @JsonAlias({"desk_id"}) String deskId,
        @NotBlank @JsonAlias({"emp_id", "assignedUserId", "assigned_user_id"}) String empId,
        @JsonAlias({"assignment_type"}) SeatAssignment.AssignmentType assignmentType,
        @JsonAlias({"is_temporary", "isTemporary"}) Boolean temporary,
        @JsonAlias({"start_date"}) Instant startDate,
        @JsonAlias({"end_date"}) Instant endDate,
        @JsonAlias({"note"}) String notes
) {
    @AssertTrue(message = "Provide deskCode, deskObjectId, or deskId")
    public boolean hasDeskIdentity() {
        return notBlank(deskCode) || notBlank(deskObjectId) || notBlank(deskId);
    }

    private static boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }
}
