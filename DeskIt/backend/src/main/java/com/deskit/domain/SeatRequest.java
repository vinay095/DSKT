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
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "seat_requests")
@EntityListeners(AuditingEntityListener.class)
public class SeatRequest {

    public enum Status {
        pending,
        approved,
        rejected;

        @JsonCreator
        public static Status fromJson(String value) {
            if (value == null || value.isBlank()) {
                return null;
            }
            return Status.valueOf(value.trim().toLowerCase(Locale.ROOT));
        }
    }

    @Id
    private UUID id;

    @Column(name = "emp_id", nullable = false, length = 64)
    private String empId;

    @Column(name = "requested_desk_id", length = 128)
    private String requestedDeskId;

    @Column(name = "floor_id", length = 64)
    private String floorId;

    @Column(name = "office_id", length = 64)
    private String officeId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Status status = Status.pending;

    private String notes;

    @Column(name = "reviewed_by", length = 64)
    private String reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected SeatRequest() {
    }

    public static SeatRequest create(
            String empId,
            String requestedDeskId,
            String floorId,
            String officeId,
            String notes
    ) {
        SeatRequest request = new SeatRequest();
        request.id = UUID.randomUUID();
        request.empId = empId;
        request.requestedDeskId = requestedDeskId;
        request.floorId = floorId;
        request.officeId = officeId;
        request.notes = notes;
        request.status = Status.pending;
        return request;
    }

    public void review(Status status, String reviewedBy) {
        if (this.status != Status.pending) {
            throw new IllegalStateException("Seat request already reviewed");
        }
        if (status == Status.pending) {
            throw new IllegalArgumentException("Review status must be approved or rejected");
        }
        this.status = status;
        this.reviewedBy = reviewedBy;
        this.reviewedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getEmpId() {
        return empId;
    }

    public String getRequestedDeskId() {
        return requestedDeskId;
    }

    public String getFloorId() {
        return floorId;
    }

    public String getOfficeId() {
        return officeId;
    }

    public Status getStatus() {
        return status;
    }

    public String getNotes() {
        return notes;
    }

    public String getReviewedBy() {
        return reviewedBy;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
