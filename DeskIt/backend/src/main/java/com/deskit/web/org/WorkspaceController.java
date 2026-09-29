package com.deskit.web.org;

import com.deskit.service.WorkspaceCompatService;
import com.deskit.web.org.dto.WorkspaceResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Compatibility reads for legacy {@code workspaces} table consumers.
 * New integrations should use {@code /api/v1/offices} and {@code /api/v1/floors}.
 */
@RestController
@RequestMapping("/api/v1/workspaces")
@Tag(name = "Workspaces (compat)")
@SecurityRequirement(name = "bearer-jwt")
public class WorkspaceController {

    private final WorkspaceCompatService workspaceCompatService;

    public WorkspaceController(WorkspaceCompatService workspaceCompatService) {
        this.workspaceCompatService = workspaceCompatService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List floors as legacy workspace rows (snake_case)")
    public List<WorkspaceResponse> list() {
        return workspaceCompatService.listAll();
    }

    @GetMapping("/{workspaceId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get one workspace by floor id")
    public WorkspaceResponse get(@PathVariable String workspaceId) {
        return workspaceCompatService.get(workspaceId);
    }
}
