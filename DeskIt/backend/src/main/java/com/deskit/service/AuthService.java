package com.deskit.service;

import com.deskit.domain.AppRole;
import com.deskit.security.DeskItPrincipal;
import com.deskit.security.JwtService;
import com.deskit.security.RefreshTokenStore;
import com.deskit.web.auth.dto.TokenResponse;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final JwtService jwtService;
    private final RefreshTokenStore refreshTokenStore;
    private final UserProvisioningService userProvisioningService;

    public AuthService(
            JwtService jwtService,
            RefreshTokenStore refreshTokenStore,
            UserProvisioningService userProvisioningService
    ) {
        this.jwtService = jwtService;
        this.refreshTokenStore = refreshTokenStore;
        this.userProvisioningService = userProvisioningService;
    }

    public TokenResponse issueTokens(DeskItPrincipal principal) {
        String accessToken = jwtService.createAccessToken(principal);
        String refreshToken = refreshTokenStore.issue(principal.getUserId());
        return TokenResponse.of(accessToken, refreshToken, principal);
    }

    public TokenResponse refresh(String refreshToken) {
        UUID userId = refreshTokenStore.resolveUserId(refreshToken)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

        DeskItPrincipal principal = userProvisioningService.loadPrincipal(userId);
        String accessToken = jwtService.createAccessToken(principal);
        String newRefresh = UUID.randomUUID().toString();
        refreshTokenStore.rotate(refreshToken, newRefresh, userId);
        return TokenResponse.of(accessToken, newRefresh, principal);
    }

    public void logout(String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            refreshTokenStore.revoke(refreshToken);
        }
    }

    public TokenResponse devLoginByEmail(String email) {
        DeskItPrincipal principal = userProvisioningService.loadByEmailForDevLogin(email);
        return issueTokens(principal);
    }

    public TokenResponse devLoginByRole(AppRole role) {
        DeskItPrincipal principal = userProvisioningService.loadByRoleForDevLogin(role);
        return issueTokens(principal);
    }
}
