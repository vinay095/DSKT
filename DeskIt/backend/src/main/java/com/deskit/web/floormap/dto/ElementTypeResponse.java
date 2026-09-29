package com.deskit.web.floormap.dto;

import com.deskit.domain.ElementType;
import com.deskit.domain.PredefinedElementType;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Catalog entry with nested {@code dimensions} / {@code associated_ui} for frontend
 * {@code DbElementType}, plus flat cells/color fields for existing API clients.
 */
public record ElementTypeResponse(
        @JsonProperty("elementId") String elementId,
        @JsonProperty("element_id") String elementIdSnake,
        @JsonProperty("elementName") String elementName,
        @JsonProperty("element_name") String elementNameSnake,
        String category,
        Integer widthCells,
        Integer heightCells,
        String color,
        String svgAssetPath,
        Map<String, Object> dimensions,
        @JsonProperty("associatedUi") Map<String, Object> associatedUi,
        @JsonProperty("associated_ui") Map<String, Object> associatedUiSnake
) {
    public static ElementTypeResponse from(ElementType type) {
        PredefinedElementType predefined = type.getPredefined();
        Integer width = predefined == null ? null : predefined.getWidthCells();
        Integer height = predefined == null ? null : predefined.getHeightCells();
        String color = predefined == null ? null : predefined.getColor();
        String svg = predefined == null ? null : predefined.getSvgAssetPath();

        Map<String, Object> dimensions = new LinkedHashMap<>();
        dimensions.put("widthFinest", width);
        dimensions.put("heightFinest", height);

        Map<String, Object> associatedUi = new LinkedHashMap<>();
        associatedUi.put("icon", svg);
        associatedUi.put("color", color);
        associatedUi.put("description", type.getElementName());

        return new ElementTypeResponse(
                type.getElementId(),
                type.getElementId(),
                type.getElementName(),
                type.getElementName(),
                type.getCategory(),
                width,
                height,
                color,
                svg,
                dimensions,
                associatedUi,
                associatedUi
        );
    }
}
