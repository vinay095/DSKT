package com.deskit.web.request;

import com.deskit.domain.SeatRequest;
import com.deskit.service.SeatRequestService;
import com.deskit.web.request.dto.CreateSeatRequestBody;
import com.deskit.web.request.dto.ReviewSeatRequestBody;
import com.deskit.web.request.dto.SeatRequestResponse;
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
@RequestMapping("/api/v1/seat-requests")
@Tag(name = "Seat Requests")
@SecurityRequirement(name = "bearer-jwt")
public class SeatRequestController {

    private final SeatRequestService seatRequestService;

    public SeatRequestController(SeatRequestService seatRequestService) {
        this.seatRequestService = seatRequestService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    @Operation(summary = "List seat requests (optional status filter)")
    public List<SeatRequestResponse> list(@RequestParam(required = false) SeatRequest.Status status) {
        return seatRequestService.list(status);
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a seat assignment request")
    public SeatRequestResponse create(@Valid @RequestBody CreateSeatRequestBody body) {
        return seatRequestService.create(body);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    @Operation(summary = "Approve or reject a seat request (HR or ADMIN)")
    public SeatRequestResponse review(
            @PathVariable UUID id,
            @Valid @RequestBody ReviewSeatRequestBody body
    ) {
        return seatRequestService.review(id, body.status());
    }
}
