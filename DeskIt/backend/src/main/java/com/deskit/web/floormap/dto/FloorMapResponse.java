package com.deskit.web.floormap.dto;

import com.deskit.domain.FloorMap;
import com.deskit.domain.MapChannel;
import java.time.Instant;
import java.util.Map;

public record FloorMapResponse(
        String floorMapId,
        String floorId,
        MapChannel channel,
        int schemaVersion,
        int releaseVersion,
        String name,
        boolean published,
        Instant publishedAt,
        Instant lastModified,
        Map<String, Object> document,
        Map<String, Object> floorConfig,
        Map<String, Object> planDocument
) {
    public static FloorMapResponse from(FloorMap map) {
        return new FloorMapResponse(
                map.getFloorMapId(),
                map.getFloorId(),
                map.getChannel(),
                map.getSchemaVersion(),
                map.getReleaseVersion(),
                map.getName(),
                map.isPublished(),
                map.getPublishedAt(),
                map.getLastModified(),
                map.getDocument(),
                map.getFloorConfig(),
                map.getPlanDocument()
        );
    }
}
