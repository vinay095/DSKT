package com.deskit.web.floormap;

import com.deskit.service.ElementTypeService;
import com.deskit.web.floormap.dto.ElementTypeResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/element-types")
@Tag(name = "Element Catalog")
@SecurityRequirement(name = "bearer-jwt")
public class ElementTypeController {

    private final ElementTypeService elementTypeService;

    public ElementTypeController(ElementTypeService elementTypeService) {
        this.elementTypeService = elementTypeService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List predefined element types (from creator catalog)")
    public List<ElementTypeResponse> list() {
        return elementTypeService.listAll();
    }
}
