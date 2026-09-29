package com.deskit.service;

import com.deskit.config.DeskItProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Optional sync of published FloorDocument geometry into PostGIS tables for spatial queries.
 * Document jsonb remains the source of truth.
 */
@Service
public class PostgisFloorSyncService {

    private static final Logger log = LoggerFactory.getLogger(PostgisFloorSyncService.class);

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final DeskItProperties properties;

    public PostgisFloorSyncService(
            JdbcTemplate jdbcTemplate,
            ObjectMapper objectMapper,
            DeskItProperties properties
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
        this.properties = properties;
    }

    @Transactional
    public void syncPublishedDocument(String floorMapId, Map<String, Object> document) {
        if (!properties.getHarden().isPostgisSyncEnabled()) {
            return;
        }
        if (floorMapId == null || document == null) {
            return;
        }

        jdbcTemplate.update("DELETE FROM floor_map_entities WHERE floor_map_id = ?", floorMapId);
        jdbcTemplate.update("DELETE FROM floor_map_zones WHERE floor_map_id = ?", floorMapId);
        jdbcTemplate.update("DELETE FROM floor_map_unusable WHERE floor_map_id = ?", floorMapId);

        JsonNode root = objectMapper.valueToTree(document);
        int entities = syncEntities(floorMapId, root.path("entities"));
        int zones = syncZones(floorMapId, root.path("zones"));
        int unusable = syncUnusable(floorMapId, root.path("unusableRegions"));
        log.debug(
                "PostGIS sync for {}: entities={}, zones={}, unusable={}",
                floorMapId,
                entities,
                zones,
                unusable
        );
    }

    private int syncEntities(String floorMapId, JsonNode entities) {
        if (!entities.isArray()) {
            return 0;
        }
        int count = 0;
        for (JsonNode entity : entities) {
            String objectId = text(entity, "objectId");
            String category = text(entity, "category");
            String elementType = text(entity, "elementType");
            if (objectId == null || category == null || elementType == null) {
                continue;
            }
            int originCol = entity.path("origin").path("col").asInt(0);
            int originRow = entity.path("origin").path("row").asInt(0);
            int width = entity.path("widthCells").asInt(1);
            int height = entity.path("heightCells").asInt(1);
            int rotation = entity.path("rotation").asInt(0);
            String placeLevel = text(entity, "placeLevel");
            String label = text(entity, "label");
            String wkt = polygonWkt(originCol, originRow, width, height, entity.path("outline"));

            jdbcTemplate.update(
                    """
                    INSERT INTO floor_map_entities (
                        floor_map_id, object_id, category, element_type,
                        origin_col, origin_row, width_cells, height_cells,
                        rotation, place_level, label, outline, synced_at
                    ) VALUES (
                        ?, ?, ?, ?,
                        ?, ?, ?, ?,
                        ?, ?, ?, ST_GeomFromText(?, 0), now()
                    )
                    """,
                    floorMapId,
                    objectId,
                    category,
                    elementType,
                    originCol,
                    originRow,
                    width,
                    height,
                    rotation,
                    placeLevel,
                    label,
                    wkt
            );
            count++;
        }
        return count;
    }

    private int syncZones(String floorMapId, JsonNode zones) {
        if (!zones.isArray()) {
            return 0;
        }
        int count = 0;
        for (JsonNode zone : zones) {
            String zoneId = text(zone, "id");
            if (zoneId == null) {
                continue;
            }
            int originCol = zone.path("origin").path("col").asInt(0);
            int originRow = zone.path("origin").path("row").asInt(0);
            int width = zone.path("widthCells").asInt(1);
            int height = zone.path("heightCells").asInt(1);
            String wkt = polygonWkt(originCol, originRow, width, height, zone.path("outline"));
            jdbcTemplate.update(
                    """
                    INSERT INTO floor_map_zones (
                        floor_map_id, zone_id, label, color,
                        origin_col, origin_row, width_cells, height_cells,
                        outline, synced_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ST_GeomFromText(?, 0), now())
                    """,
                    floorMapId,
                    zoneId,
                    text(zone, "label"),
                    text(zone, "color"),
                    originCol,
                    originRow,
                    width,
                    height,
                    wkt
            );
            count++;
        }
        return count;
    }

    private int syncUnusable(String floorMapId, JsonNode regions) {
        if (!regions.isArray()) {
            return 0;
        }
        int count = 0;
        for (JsonNode region : regions) {
            String regionId = text(region, "id");
            if (regionId == null) {
                continue;
            }
            int originCol = region.path("origin").path("col").asInt(0);
            int originRow = region.path("origin").path("row").asInt(0);
            int width = region.path("widthCells").asInt(1);
            int height = region.path("heightCells").asInt(1);
            String wkt = polygonWkt(originCol, originRow, width, height, region.path("outline"));
            jdbcTemplate.update(
                    """
                    INSERT INTO floor_map_unusable (
                        floor_map_id, region_id, label,
                        origin_col, origin_row, width_cells, height_cells,
                        outline, synced_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ST_GeomFromText(?, 0), now())
                    """,
                    floorMapId,
                    regionId,
                    text(region, "label"),
                    originCol,
                    originRow,
                    width,
                    height,
                    wkt
            );
            count++;
        }
        return count;
    }

    /**
     * Build a closed polygon in finest-cell CRS (SRID 0).
     * Outline vertices are relative to origin when present; otherwise AABB.
     */
    static String polygonWkt(int originCol, int originRow, int width, int height, JsonNode outline) {
        List<double[]> ring = new ArrayList<>();
        if (outline != null && outline.isArray() && outline.size() >= 3) {
            for (JsonNode vertex : outline) {
                double col = originCol + vertex.path("col").asDouble(0);
                double row = originRow + vertex.path("row").asDouble(0);
                ring.add(new double[]{col, row});
            }
        } else {
            int w = Math.max(width, 1);
            int h = Math.max(height, 1);
            ring.add(new double[]{originCol, originRow});
            ring.add(new double[]{originCol + w, originRow});
            ring.add(new double[]{originCol + w, originRow + h});
            ring.add(new double[]{originCol, originRow + h});
        }
        double[] first = ring.getFirst();
        double[] last = ring.getLast();
        if (first[0] != last[0] || first[1] != last[1]) {
            ring.add(new double[]{first[0], first[1]});
        }

        StringBuilder sb = new StringBuilder("POLYGON((");
        for (int i = 0; i < ring.size(); i++) {
            if (i > 0) {
                sb.append(", ");
            }
            sb.append(String.format(Locale.ROOT, "%s %s", trim(ring.get(i)[0]), trim(ring.get(i)[1])));
        }
        sb.append("))");
        return sb.toString();
    }

    private static String trim(double value) {
        if (value == (long) value) {
            return Long.toString((long) value);
        }
        return Double.toString(value);
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        String text = value.asText();
        return text == null || text.isBlank() ? null : text;
    }
}
