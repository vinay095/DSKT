package com.deskit.web.assignment;

import com.deskit.service.IdempotencyService;
import com.deskit.service.SeatAssignmentService;
import com.deskit.web.assignment.dto.AssignSeatRequest;
import com.deskit.web.assignment.dto.SeatAssignmentResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Seat Assignments")
@SecurityRequirement(name = "bearer-jwt")
public class SeatAssignmentController {

    private final SeatAssignmentService seatAssignmentService;
    private final IdempotencyService idempotencyService;

    public SeatAssignmentController(
            SeatAssignmentService seatAssignmentService,
            IdempotencyService idempotencyService
    ) {
        this.seatAssignmentService = seatAssignmentService;
        this.idempotencyService = idempotencyService;
    }

    @GetMapping("/floors/{floorId}/assignments")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List active assignments on a floor")
    public List<SeatAssignmentResponse> listByFloor(@PathVariable String floorId) {
        return seatAssignmentService.listByFloor(floorId);
    }

    @GetMapping("/employees/{empId}/assignments")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List active assignments for an employee")
    public List<SeatAssignmentResponse> listByEmployee(@PathVariable String empId) {
        return seatAssignmentService.listByEmployee(empId);
    }

    @PostMapping("/floors/{floorId}/assignments")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    @Operation(summary = "Assign a seat (HR or ADMIN). Supports Idempotency-Key header. "
            + "Accepts camelCase or snake_case body; floorId may be a floor or fmap-* id.")
    public ResponseEntity<SeatAssignmentResponse> assign(
            @PathVariable String floorId,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody AssignSeatRequest request
    ) {
        String path = "/api/v1/floors/" + floorId + "/assignments";
        return idempotencyService.execute(
                idempotencyKey,
                "POST",
                path,
                request,
                SeatAssignmentResponse.class,
                HttpStatus.CREATED,
                () -> seatAssignmentService.assign(floorId, request)
        );
    }

    @DeleteMapping("/floors/{floorId}/assignments/{deskCode}")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Unassign / revoke active seat (HR or ADMIN). Path segment may be deskCode or deskObjectId.")
    public void unassign(@PathVariable String floorId, @PathVariable String deskCode) {
        seatAssignmentService.unassign(floorId, deskCode);
    }
}
