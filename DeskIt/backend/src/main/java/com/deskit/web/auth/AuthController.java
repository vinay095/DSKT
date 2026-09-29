package com.deskit.web.auth;

import com.deskit.config.DeskItProperties;
import com.deskit.domain.AppRole;
import com.deskit.security.DeskItPrincipal;
import com.deskit.service.AuthService;
import com.deskit.web.auth.dto.DevLoginRequest;
import com.deskit.web.auth.dto.LogoutRequest;
import com.deskit.web.auth.dto.RefreshRequest;
import com.deskit.web.auth.dto.TokenResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Auth")
public class AuthController {

    private static final Set<String> SUPPORTED_PROVIDERS = Set.of("microsoft", "okta", "google");

    private final AuthService authService;
    private final DeskItProperties properties;
    private final ObjectProvider<ClientRegistrationRepository> clientRegistrationRepository;

    public AuthController(
            AuthService authService,
            DeskItProperties properties,
            ObjectProvider<ClientRegistrationRepository> clientRegistrationRepository
    ) {
        this.authService = authService;
        this.properties = properties;
        this.clientRegistrationRepository = clientRegistrationRepository;
    }

    @GetMapping("/providers")
    @Operation(summary = "List configured SSO providers")
    public Map<String, Object> providers() {
        List<String> configured = new ArrayList<>();
        ClientRegistrationRepository repo = clientRegistrationRepository.getIfAvailable();
        if (repo != null) {
            for (String provider : SUPPORTED_PROVIDERS) {
                ClientRegistration registration = repo.findByRegistrationId(provider);
                if (registration != null) {
                    configured.add(provider);
                }
            }
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("providers", configured);
        body.put("devLoginEnabled", properties.getSecurity().isDevLoginEnabled());
        return body;
    }

    @GetMapping("/login/{provider}")
    @Operation(summary = "Start OIDC login (redirects to IdP)")
    public void login(@PathVariable String provider, HttpServletResponse response) throws IOException {
        String normalized = provider.toLowerCase();
        if (!SUPPORTED_PROVIDERS.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported provider: " + provider);
        }
        ClientRegistrationRepository repo = clientRegistrationRepository.getIfAvailable();
        if (repo == null || repo.findByRegistrationId(normalized) == null) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "SSO provider not configured: " + normalized
            );
        }
        response.sendRedirect("/oauth2/authorization/" + normalized);
    }

    @PostMapping("/dev-login")
    @Operation(summary = "Local/dev login against seeded users (disabled in prod)")
    public TokenResponse devLogin(@Valid @RequestBody DevLoginRequest request) {
        if (!properties.getSecurity().isDevLoginEnabled()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Dev login disabled");
        }
        if (request.email() != null && !request.email().isBlank()) {
            return authService.devLoginByEmail(request.email().trim());
        }
        return authService.devLoginByRole(request.role());
    }

    @PostMapping("/refresh")
    @Operation(summary = "Rotate refresh token and issue a new access token")
    public TokenResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request.refreshToken());
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke refresh token")
    public ResponseEntity<Void> logout(@RequestBody(required = false) LogoutRequest request) {
        if (request != null) {
            authService.logout(request.refreshToken());
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Current authenticated user")
    public TokenResponse.MeResponse me(@AuthenticationPrincipal DeskItPrincipal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        return TokenResponse.MeResponse.from(principal);
    }

    @GetMapping("/admin-check")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Method-security probe for ADMIN role")
    public Map<String, String> adminCheck() {
        return Map.of("status", "ok", "role", AppRole.ADMIN.name());
    }
}
