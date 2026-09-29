package com.deskit.web.request;

import com.deskit.domain.FloorChangeRequest;
import com.deskit.service.FloorChangeRequestService;
import com.deskit.web.request.dto.CreateFloorChangeRequestBody;
import com.deskit.web.request.dto.FloorChangeRequestResponse;
import com.deskit.web.request.dto.ReviewFloorChangeRequestBody;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/floor-change-requests")
@Tag(name = "Floor Change Requests")
@SecurityRequirement(name = "bearer-jwt")
public class FloorChangeRequestController {

    private final FloorChangeRequestService floorChangeRequestService;

    public FloorChangeRequestController(FloorChangeRequestService floorChangeRequestService) {
        this.floorChangeRequestService = floorChangeRequestService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    @Operation(summary = "List floor change requests")
    public List<FloorChangeRequestResponse> list(@RequestParam(required = false) FloorChangeRequest.Status status) {
        return floorChangeRequestService.list(status);
    }

    @PostMapping
    @PreAuthorize("hasRole('HR')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Submit a floor change request (HR → Admin)")
    public FloorChangeRequestResponse create(@Valid @RequestBody CreateFloorChangeRequestBody body) {
        return floorChangeRequestService.create(body);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Acknowledge / complete / reject a floor change request (Admin)")
    public FloorChangeRequestResponse review(
            @PathVariable UUID id,
            @Valid @RequestBody ReviewFloorChangeRequestBody body
    ) {
        return floorChangeRequestService.review(id, body.status());
    }
}
