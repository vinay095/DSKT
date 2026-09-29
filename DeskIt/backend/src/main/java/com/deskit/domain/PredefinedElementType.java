package com.deskit.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "predefined_element_types")
public class PredefinedElementType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "element_type_id", nullable = false, unique = true)
    private ElementType elementType;

    @Column(name = "width_cells", nullable = false)
    private int widthCells;

    @Column(name = "height_cells", nullable = false)
    private int heightCells;

    @Column(length = 32)
    private String color;

    @Column(name = "svg_asset_path")
    private String svgAssetPath;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected PredefinedElementType() {
    }

    public static PredefinedElementType create(int widthCells, int heightCells, String color, String svgAssetPath) {
        PredefinedElementType predefined = new PredefinedElementType();
        predefined.widthCells = widthCells;
        predefined.heightCells = heightCells;
        predefined.color = color;
        predefined.svgAssetPath = svgAssetPath;
        predefined.createdAt = Instant.now();
        return predefined;
    }

    void setElementType(ElementType elementType) {
        this.elementType = elementType;
    }

    public Long getId() {
        return id;
    }

    public int getWidthCells() {
        return widthCells;
    }

    public int getHeightCells() {
        return heightCells;
    }

    public String getColor() {
        return color;
    }

    public String getSvgAssetPath() {
        return svgAssetPath;
    }
}
