package com.deskit.web.org.dto;

import com.deskit.domain.Floor;

public record FloorResponse(
        String id,
        String officeId,
        String label,
        String shortLabel,
        String locationLabel,
        String block,
        String building,
        boolean custom,
        String clonedFromId,
        String activePublishedMapId,
        Double scale
) {
    public static FloorResponse from(Floor floor) {
        return new FloorResponse(
                floor.getId(),
                floor.getOfficeId(),
                floor.getLabel(),
                floor.getShortLabel(),
                floor.getLocationLabel(),
                floor.getBlock(),
                floor.getBuilding(),
                floor.isCustom(),
                floor.getClonedFromId(),
                floor.getActivePublishedMapId(),
                floor.getScale()
        );
    }
}
