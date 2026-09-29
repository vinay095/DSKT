package com.deskit.web.org;

import com.deskit.service.FloorService;
import com.deskit.web.org.dto.CloneFloorRequest;
import com.deskit.web.org.dto.CreateFloorRequest;
import com.deskit.web.org.dto.FloorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/floors")
@Tag(name = "Floors")
@SecurityRequirement(name = "bearer-jwt")
public class FloorController {

    private final FloorService floorService;

    public FloorController(FloorService floorService) {
        this.floorService = floorService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List floors (optionally by office)")
    public List<FloorResponse> list(@RequestParam(required = false) String officeId) {
        if (officeId == null || officeId.isBlank()) {
            return floorService.listAll();
        }
        return floorService.listByOffice(officeId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get floor by id")
    public FloorResponse get(@PathVariable String id) {
        return floorService.getFloor(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a custom floor")
    public FloorResponse create(@Valid @RequestBody CreateFloorRequest request) {
        return floorService.create(request);
    }

    @PostMapping("/{id}/clone")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Clone a floor (metadata; maps in Phase 3)")
    public FloorResponse clone(@PathVariable String id, @Valid @RequestBody CloneFloorRequest request) {
        return floorService.cloneFloor(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Soft-delete a custom floor")
    public void delete(@PathVariable String id) {
        floorService.deleteCustomFloor(id);
    }
}
