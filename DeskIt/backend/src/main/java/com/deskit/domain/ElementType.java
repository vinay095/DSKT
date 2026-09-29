package com.deskit.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "element_types")
@EntityListeners(AuditingEntityListener.class)
public class ElementType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "element_id", nullable = false, unique = true, length = 128)
    private String elementId;

    @Column(name = "element_name", nullable = false)
    private String elementName;

    @Column(nullable = false, length = 64)
    private String category;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToOne(mappedBy = "elementType", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    private PredefinedElementType predefined;

    protected ElementType() {
    }

    public static ElementType create(String elementId, String elementName, String category) {
        ElementType type = new ElementType();
        type.elementId = elementId;
        type.elementName = elementName;
        type.category = category;
        return type;
    }

    public void setPredefined(PredefinedElementType predefined) {
        this.predefined = predefined;
        if (predefined != null) {
            predefined.setElementType(this);
        }
    }

    public Long getId() {
        return id;
    }

    public String getElementId() {
        return elementId;
    }

    public String getElementName() {
        return elementName;
    }

    public String getCategory() {
        return category;
    }

    public PredefinedElementType getPredefined() {
        return predefined;
    }
}
