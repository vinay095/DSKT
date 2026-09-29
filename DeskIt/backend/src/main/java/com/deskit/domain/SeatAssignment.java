package com.deskit.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "seat_assignments")
@EntityListeners(AuditingEntityListener.class)
public class SeatAssignment {

    public enum AssignmentType {
        permanent,
        temporary;

        @JsonCreator
        public static AssignmentType fromJson(String value) {
            if (value == null || value.isBlank()) {
                return null;
            }
            return AssignmentType.valueOf(value.trim().toLowerCase(Locale.ROOT));
        }
    }

    public enum Status {
        active,
        expired,
        revoked;

        @JsonCreator
        public static Status fromJson(String value) {
            if (value == null || value.isBlank()) {
                return null;
            }
            return Status.valueOf(value.trim().toLowerCase(Locale.ROOT));
        }
    }

    @Id
    @Column(name = "assignment_id")
    private UUID assignmentId;

    @Column(name = "floor_id", nullable = false, length = 64)
    private String floorId;

    @Column(name = "floor_map_id", length = 64)
    private String floorMapId;

    @Column(name = "desk_code", nullable = false, length = 128)
    private String deskCode;

    @Column(name = "desk_object_id", length = 128)
    private String deskObjectId;

    @Column(name = "emp_id", nullable = false, length = 64)
    private String empId;

    @Enumerated(EnumType.STRING)
    @Column(name = "assignment_type", nullable = false, length = 32)
    private AssignmentType assignmentType = AssignmentType.permanent;

    @Column(name = "is_temporary", nullable = false)
    private boolean temporary;

    @Column(name = "start_date")
    private Instant startDate;

    @Column(name = "end_date")
    private Instant endDate;

    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Status status = Status.active;

    @Column(name = "assigned_by", length = 64)
    private String assignedBy;

    @Column(name = "assigned_at", nullable = false)
    private Instant assignedAt = Instant.now();

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected SeatAssignment() {
    }

    public static SeatAssignment create(
            String floorId,
            String floorMapId,
            String deskCode,
            String deskObjectId,
            String empId,
            AssignmentType type,
            boolean temporary,
            Instant startDate,
            Instant endDate,
            String notes,
            String assignedBy
    ) {
        SeatAssignment assignment = new SeatAssignment();
        assignment.assignmentId = UUID.randomUUID();
        assignment.floorId = floorId;
        assignment.floorMapId = floorMapId;
        assignment.deskCode = deskCode;
        assignment.deskObjectId = deskObjectId;
        assignment.empId = empId;
        assignment.assignmentType = type;
        assignment.temporary = temporary;
        assignment.startDate = startDate;
        assignment.endDate = endDate;
        assignment.notes = notes;
        assignment.status = Status.active;
        assignment.assignedBy = assignedBy;
        assignment.assignedAt = Instant.now();
        return assignment;
    }

    public void revoke() {
        this.status = Status.revoked;
    }

    public void expire() {
        this.status = Status.expired;
    }

    public UUID getAssignmentId() {
        return assignmentId;
    }

    public String getFloorId() {
        return floorId;
    }

    public String getFloorMapId() {
        return floorMapId;
    }

    public String getDeskCode() {
        return deskCode;
    }

    public String getDeskObjectId() {
        return deskObjectId;
    }

    public String getEmpId() {
        return empId;
    }

    public AssignmentType getAssignmentType() {
        return assignmentType;
    }

    public boolean isTemporary() {
        return temporary;
    }

    public Instant getStartDate() {
        return startDate;
    }

    public Instant getEndDate() {
        return endDate;
    }

    public String getNotes() {
        return notes;
    }

    public Status getStatus() {
        return status;
    }

    public String getAssignedBy() {
        return assignedBy;
    }

    public Instant getAssignedAt() {
        return assignedAt;
    }
}
