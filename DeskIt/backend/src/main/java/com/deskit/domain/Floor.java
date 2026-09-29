package com.deskit.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "floors")
@EntityListeners(AuditingEntityListener.class)
public class Floor {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "office_id", nullable = false, length = 64)
    private String officeId;

    @Column(nullable = false)
    private String label;

    @Column(name = "short_label", nullable = false, length = 128)
    private String shortLabel;

    @Column(name = "location_label", nullable = false)
    private String locationLabel;

    private String block;

    private String building;

    @Column(name = "cloned_from_id", length = 64)
    private String clonedFromId;

    @Column(name = "is_custom", nullable = false)
    private boolean custom;

    @Column(name = "active_published_map_id", length = 64)
    private String activePublishedMapId;

    private Double scale;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Floor() {
    }

    public static Floor create(
            String id,
            String officeId,
            String label,
            String shortLabel,
            String locationLabel,
            String block,
            String building,
            String clonedFromId,
            boolean custom
    ) {
        Floor floor = new Floor();
        floor.id = id;
        floor.officeId = officeId;
        floor.label = label;
        floor.shortLabel = shortLabel;
        floor.locationLabel = locationLabel;
        floor.block = block;
        floor.building = building;
        floor.clonedFromId = clonedFromId;
        floor.custom = custom;
        floor.active = true;
        return floor;
    }

    public void softDelete() {
        this.active = false;
        this.deletedAt = Instant.now();
    }

    public void setActivePublishedMapId(String activePublishedMapId) {
        this.activePublishedMapId = activePublishedMapId;
    }

    public String getId() {
        return id;
    }

    public String getOfficeId() {
        return officeId;
    }

    public String getLabel() {
        return label;
    }

    public String getShortLabel() {
        return shortLabel;
    }

    public String getLocationLabel() {
        return locationLabel;
    }

    public String getBlock() {
        return block;
    }

    public String getBuilding() {
        return building;
    }

    public String getClonedFromId() {
        return clonedFromId;
    }

    public boolean isCustom() {
        return custom;
    }

    public String getActivePublishedMapId() {
        return activePublishedMapId;
    }

    public Double getScale() {
        return scale;
    }

    public boolean isActive() {
        return active;
    }

    public Instant getDeletedAt() {
        return deletedAt;
    }
}
