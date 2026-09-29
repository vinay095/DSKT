package com.deskit.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "floor_maps")
@EntityListeners(AuditingEntityListener.class)
public class FloorMap {

    @Id
    @Column(name = "floor_map_id", length = 64)
    private String floorMapId;

    @Column(name = "floor_id", nullable = false, length = 64)
    private String floorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private MapChannel channel;

    @Column(name = "schema_version", nullable = false)
    private int schemaVersion = 2;

    @Column(name = "release_version", nullable = false)
    private int releaseVersion;

    @Column(nullable = false)
    private String name;

    @Column(name = "is_published", nullable = false)
    private boolean published;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "last_modified", nullable = false)
    private Instant lastModified = Instant.now();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> document = new LinkedHashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "floor_config", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> floorConfig = new LinkedHashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "plan_document", columnDefinition = "jsonb")
    private Map<String, Object> planDocument;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected FloorMap() {
    }

    public static FloorMap createDraft(String floorId, String name, Map<String, Object> document) {
        FloorMap map = new FloorMap();
        map.floorMapId = "fmap-draft-" + floorId;
        map.floorId = floorId;
        map.channel = MapChannel.draft;
        map.schemaVersion = 2;
        map.releaseVersion = 0;
        map.name = name;
        map.published = false;
        map.document = document;
        map.floorConfig = extractFloorConfig(document);
        map.lastModified = Instant.now();
        return map;
    }

    public static FloorMap createPublished(String floorId, String name) {
        FloorMap map = new FloorMap();
        map.floorMapId = "fmap-pub-" + floorId;
        map.floorId = floorId;
        map.channel = MapChannel.published;
        map.schemaVersion = 2;
        map.releaseVersion = 0;
        map.name = name;
        map.published = true;
        map.document = emptyDocument(name);
        map.floorConfig = extractFloorConfig(map.document);
        map.lastModified = Instant.now();
        map.publishedAt = Instant.now();
        return map;
    }

    public static Map<String, Object> emptyDocument(String name) {
        Map<String, Object> floor = new LinkedHashMap<>();
        floor.put("cols", 12);
        floor.put("rows", 12);
        floor.put("a", 1);

        Map<String, Object> doc = new LinkedHashMap<>();
        doc.put("version", 2);
        doc.put("name", name);
        doc.put("a", 1);
        doc.put("floor", floor);
        doc.put("entities", java.util.List.of());
        doc.put("zones", java.util.List.of());
        doc.put("customLibrary", java.util.List.of());
        doc.put("unusableRegions", java.util.List.of());
        return doc;
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> extractFloorConfig(Map<String, Object> document) {
        Object floor = document.get("floor");
        if (floor instanceof Map<?, ?> map) {
            return new LinkedHashMap<>((Map<String, Object>) map);
        }
        Map<String, Object> fallback = new LinkedHashMap<>();
        fallback.put("cols", 12);
        fallback.put("rows", 12);
        fallback.put("a", document.getOrDefault("a", 1));
        return fallback;
    }

    public void replaceDocument(Map<String, Object> document) {
        this.document = document;
        this.floorConfig = extractFloorConfig(document);
        this.lastModified = Instant.now();
        Object version = document.get("version");
        if (version instanceof Number number) {
            this.schemaVersion = number.intValue();
        }
        Object name = document.get("name");
        if (name != null && !name.toString().isBlank()) {
            this.name = name.toString();
        }
    }

    public void replacePlanDocument(Map<String, Object> planDocument) {
        this.planDocument = planDocument;
        this.lastModified = Instant.now();
    }

    public void markPublishedBumpRelease() {
        this.releaseVersion = this.releaseVersion + 1;
        this.published = true;
        this.publishedAt = Instant.now();
        this.lastModified = Instant.now();
    }

    public String getFloorMapId() {
        return floorMapId;
    }

    public String getFloorId() {
        return floorId;
    }

    public MapChannel getChannel() {
        return channel;
    }

    public int getSchemaVersion() {
        return schemaVersion;
    }

    public int getReleaseVersion() {
        return releaseVersion;
    }

    public String getName() {
        return name;
    }

    public boolean isPublished() {
        return published;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }

    public Instant getLastModified() {
        return lastModified;
    }

    public Map<String, Object> getDocument() {
        return document;
    }

    public Map<String, Object> getFloorConfig() {
        return floorConfig;
    }

    public Map<String, Object> getPlanDocument() {
        return planDocument;
    }
}
