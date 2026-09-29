package com.deskit.web.assignment.dto;

import com.deskit.domain.SeatAssignment;
import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.UUID;

/**
 * CamelCase is canonical for the Spring API client. Snake_case getters mirror the
 * legacy Supabase {@code DbSeatAssignment} shape so transitional clients can bind either.
 */
public record SeatAssignmentResponse(
        @JsonProperty("assignmentId") UUID assignmentId,
        String floorId,
        String floorMapId,
        String deskCode,
        String deskObjectId,
        String empId,
        SeatAssignment.AssignmentType assignmentType,
        @JsonProperty("temporary") boolean temporary,
        Instant startDate,
        Instant endDate,
        String notes,
        SeatAssignment.Status status,
        String assignedBy,
        Instant assignedAt
) {
    public static SeatAssignmentResponse from(SeatAssignment assignment) {
        return new SeatAssignmentResponse(
                assignment.getAssignmentId(),
                assignment.getFloorId(),
                assignment.getFloorMapId(),
                assignment.getDeskCode(),
                assignment.getDeskObjectId(),
                assignment.getEmpId(),
                assignment.getAssignmentType(),
                assignment.isTemporary(),
                assignment.getStartDate(),
                assignment.getEndDate(),
                assignment.getNotes(),
                assignment.getStatus(),
                assignment.getAssignedBy(),
                assignment.getAssignedAt()
        );
    }

    @JsonGetter("assignment_id")
    public UUID assignmentIdSnake() {
        return assignmentId;
    }

    @JsonGetter("floor_id")
    public String floorIdSnake() {
        return floorId;
    }

    @JsonGetter("floor_map_id")
    public String floorMapIdSnake() {
        return floorMapId;
    }

    @JsonGetter("desk_code")
    public String deskCodeSnake() {
        return deskCode;
    }

    @JsonGetter("desk_object_id")
    public String deskObjectIdSnake() {
        return deskObjectId;
    }

    @JsonGetter("emp_id")
    public String empIdSnake() {
        return empId;
    }

    @JsonGetter("assignment_type")
    public SeatAssignment.AssignmentType assignmentTypeSnake() {
        return assignmentType;
    }

    @JsonGetter("is_temporary")
    public boolean isTemporarySnake() {
        return temporary;
    }

    @JsonGetter("isTemporary")
    public boolean isTemporaryCamel() {
        return temporary;
    }

    @JsonGetter("start_date")
    public Instant startDateSnake() {
        return startDate;
    }

    @JsonGetter("end_date")
    public Instant endDateSnake() {
        return endDate;
    }

    @JsonGetter("assigned_at")
    public Instant assignedAtSnake() {
        return assignedAt;
    }
}
