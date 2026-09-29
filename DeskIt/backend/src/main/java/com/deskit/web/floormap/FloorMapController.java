package com.deskit.web.floormap;

import com.deskit.domain.MapChannel;
import com.deskit.service.FloorMapService;
import com.deskit.service.IdempotencyService;
import com.deskit.web.floormap.dto.FloorMapResponse;
import com.deskit.web.floormap.dto.PublishRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/floors/{floorId}")
@Tag(name = "Floor Maps")
@SecurityRequirement(name = "bearer-jwt")
public class FloorMapController {

    private final FloorMapService floorMapService;
    private final IdempotencyService idempotencyService;

    public FloorMapController(FloorMapService floorMapService, IdempotencyService idempotencyService) {
        this.floorMapService = floorMapService;
        this.idempotencyService = idempotencyService;
    }

    @GetMapping("/document")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get FloorDocument v2 by channel (draft|published)")
    public FloorMapResponse getDocument(
            @PathVariable String floorId,
            @RequestParam(defaultValue = "published") String channel
    ) {
        MapChannel mapChannel = parseChannel(channel);
        if (mapChannel == MapChannel.draft) {
            requireAdmin();
        }
        return floorMapService.get(floorId, mapChannel);
    }

    @PutMapping("/document/draft")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Save draft FloorDocument v2")
    public FloorMapResponse saveDocumentDraft(
            @PathVariable String floorId,
            @RequestBody Map<String, Object> document
    ) {
        return floorMapService.saveDraftDocument(floorId, document);
    }

    @GetMapping("/plan")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get desk FloorPlan JSON by channel")
    public FloorMapResponse getPlan(
            @PathVariable String floorId,
            @RequestParam(defaultValue = "published") String channel
    ) {
        MapChannel mapChannel = parseChannel(channel);
        if (mapChannel == MapChannel.draft) {
            requireAdmin();
        }
        return floorMapService.get(floorId, mapChannel);
    }

    @PutMapping("/plan/draft")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Save draft desk FloorPlan JSON")
    public FloorMapResponse savePlanDraft(
            @PathVariable String floorId,
            @RequestBody Map<String, Object> planDocument
    ) {
        return floorMapService.saveDraftPlan(floorId, planDocument);
    }

    @PostMapping("/publish")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Publish draft to live (svg | desk | both). Supports Idempotency-Key header.")
    public ResponseEntity<FloorMapResponse> publish(
            @PathVariable String floorId,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody PublishRequest request
    ) {
        String path = "/api/v1/floors/" + floorId + "/publish";
        return idempotencyService.execute(
                idempotencyKey,
                "POST",
                path,
                request,
                FloorMapResponse.class,
                HttpStatus.OK,
                () -> floorMapService.publish(floorId, request.target())
        );
    }

    private static MapChannel parseChannel(String channel) {
        try {
            return MapChannel.valueOf(channel.trim().toLowerCase());
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "channel must be draft or published");
        }
    }

    private static void requireAdmin() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        boolean admin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (!admin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Draft channel requires ADMIN");
        }
    }
}
