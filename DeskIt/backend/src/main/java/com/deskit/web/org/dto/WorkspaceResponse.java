package com.deskit.web.org.dto;

import com.deskit.domain.Floor;
import com.deskit.domain.Office;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

/**
 * Legacy frontend {@code DbWorkspace} shape. DeskIt maps a workspace to a floor
 * (plus parent office city/country). Prefer {@code /api/v1/floors} for new clients.
 */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record WorkspaceResponse(
        String workspaceId,
        String name,
        String floor,
        String block,
        String building,
        String city,
        String country,
        String activeFloorMapId,
        Double scale,
        String officeId,
        String floorId
) {
    public static WorkspaceResponse from(Floor floorEntity, Office office) {
        String mapId = floorEntity.getActivePublishedMapId() == null
                ? "fmap-pub-" + floorEntity.getId()
                : floorEntity.getActivePublishedMapId();
        return new WorkspaceResponse(
                floorEntity.getId(),
                floorEntity.getLabel(),
                floorEntity.getShortLabel(),
                floorEntity.getBlock() == null ? "" : floorEntity.getBlock(),
                floorEntity.getBuilding() == null ? "" : floorEntity.getBuilding(),
                office.getCity(),
                office.getCountry(),
                mapId,
                floorEntity.getScale() == null ? 1.0 : floorEntity.getScale(),
                office.getId(),
                floorEntity.getId()
        );
    }
}
