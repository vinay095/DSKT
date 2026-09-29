package com.deskit.web.auth.dto;

import com.deskit.domain.AppRole;
import com.deskit.security.DeskItPrincipal;
import java.util.List;
import java.util.UUID;

public record TokenResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        MeResponse user
) {
    public static TokenResponse of(String accessToken, String refreshToken, DeskItPrincipal principal) {
        return new TokenResponse(accessToken, refreshToken, "Bearer", MeResponse.from(principal));
    }

    /**
     * {@code role} is the lowercase primary role for DeskIt frontend AuthContext mapping.
     * {@code roles} remains uppercase API authorities ({@code EMPLOYEE}|{@code HR}|{@code ADMIN}).
     * Prefer {@code empId} as the stable people identifier (matches frontend {@code User.id} / EMP-*).
     */
    public record MeResponse(
            UUID id,
            String email,
            String name,
            String empId,
            UUID orgId,
            List<String> roles,
            String role
    ) {
        public static MeResponse from(DeskItPrincipal principal) {
            List<AppRole> appRoles = principal.getRoles().stream().sorted().toList();
            List<String> roles = appRoles.stream().map(AppRole::name).toList();
            AppRole primary = AppRole.primaryOf(appRoles);
            return new MeResponse(
                    principal.getUserId(),
                    principal.getEmail(),
                    principal.getDisplayName(),
                    principal.getEmpId(),
                    principal.getOrgId(),
                    roles,
                    primary.asFrontendRole()
            );
        }
    }
}
