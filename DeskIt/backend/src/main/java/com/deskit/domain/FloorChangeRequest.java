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
@Table(name = "floor_change_requests")
@EntityListeners(AuditingEntityListener.class)
public class FloorChangeRequest {

    public enum RequestType {
        add,
        remove,
        modify;

        @JsonCreator
        public static RequestType fromJson(String value) {
            if (value == null || value.isBlank()) {
                return null;
            }
            return RequestType.valueOf(value.trim().toLowerCase(Locale.ROOT));
        }
    }

    public enum Status {
        pending,
        acknowledged,
        done,
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

    @Column(name = "requested_by_emp_id", nullable = false, length = 64)
    private String requestedByEmpId;

    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", nullable = false, length = 32)
    private RequestType requestType;

    @Column(name = "element_description", nullable = false, length = 512)
    private String elementDescription;

    @Column(nullable = false)
    private String details;

    @Column(name = "floor_id", length = 64)
    private String floorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Status status = Status.pending;

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

    protected FloorChangeRequest() {
    }

    public static FloorChangeRequest create(
            String requestedByEmpId,
            RequestType requestType,
            String elementDescription,
            String details,
            String floorId
    ) {
        FloorChangeRequest request = new FloorChangeRequest();
        request.id = UUID.randomUUID();
        request.requestedByEmpId = requestedByEmpId;
        request.requestType = requestType;
        request.elementDescription = elementDescription;
        request.details = details;
        request.floorId = floorId;
        request.status = Status.pending;
        return request;
    }

    public void updateStatus(Status status, String reviewedBy) {
        if (status == Status.pending) {
            throw new IllegalArgumentException("Cannot set status back to pending");
        }
        this.status = status;
        this.reviewedBy = reviewedBy;
        this.reviewedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getRequestedByEmpId() {
        return requestedByEmpId;
    }

    public RequestType getRequestType() {
        return requestType;
    }

    public String getElementDescription() {
        return elementDescription;
    }

    public String getDetails() {
        return details;
    }

    public String getFloorId() {
        return floorId;
    }

    public Status getStatus() {
        return status;
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
