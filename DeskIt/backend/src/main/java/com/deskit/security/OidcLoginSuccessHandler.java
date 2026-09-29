package com.deskit.security;

import com.deskit.config.DeskItProperties;
import com.deskit.service.AuthService;
import com.deskit.service.UserProvisioningService;
import com.deskit.web.auth.dto.TokenResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collection;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class OidcLoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserProvisioningService userProvisioningService;
    private final AuthService authService;
    private final DeskItProperties properties;

    public OidcLoginSuccessHandler(
            UserProvisioningService userProvisioningService,
            AuthService authService,
            DeskItProperties properties
    ) {
        this.userProvisioningService = userProvisioningService;
        this.authService = authService;
        this.properties = properties;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        String provider = oauthToken.getAuthorizedClientRegistrationId();
        OAuth2User oauthUser = oauthToken.getPrincipal();

        String email = extractEmail(oauthUser);
        String name = extractName(oauthUser, email);
        String subject = oauthUser.getName();
        String issuer = extractIssuer(oauthUser, provider);
        Set<String> groups = extractGroups(oauthUser);

        DeskItPrincipal principal = userProvisioningService.provisionOidcUser(
                provider,
                subject,
                issuer,
                email,
                name,
                groups
        );
        TokenResponse tokens = authService.issueTokens(principal);

        String redirect = UriComponentsBuilder
                .fromUriString(properties.getSecurity().getOauth2().getFrontendRedirectUrl())
                .queryParam("access_token", tokens.accessToken())
                .queryParam("refresh_token", tokens.refreshToken())
                .queryParam("token_type", tokens.tokenType())
                .build(true)
                .toUriString();

        response.sendRedirect(redirect);
    }

    private String extractEmail(OAuth2User user) {
        Object email = user.getAttribute("email");
        if (email == null) {
            email = user.getAttribute("preferred_username");
        }
        if (email == null || email.toString().isBlank()) {
            throw new IllegalStateException("OIDC profile missing email claim");
        }
        return email.toString();
    }

    private String extractName(OAuth2User user, String email) {
        Object name = user.getAttribute("name");
        if (name == null) {
            Object given = user.getAttribute("given_name");
            Object family = user.getAttribute("family_name");
            if (given != null || family != null) {
                return ((given == null ? "" : given) + " " + (family == null ? "" : family)).trim();
            }
            return email;
        }
        return name.toString();
    }

    private String extractIssuer(OAuth2User user, String provider) {
        if (user instanceof OidcUser oidcUser && oidcUser.getIssuer() != null) {
            return oidcUser.getIssuer().toString();
        }
        Object iss = user.getAttribute("iss");
        if (iss != null) {
            return iss.toString();
        }
        return "oidc:" + provider;
    }

    @SuppressWarnings("unchecked")
    private Set<String> extractGroups(OAuth2User user) {
        Set<String> groups = new HashSet<>();
        Object groupsClaim = user.getAttribute("groups");
        if (groupsClaim instanceof Collection<?> collection) {
            collection.forEach(value -> groups.add(String.valueOf(value)));
        }
        Object rolesClaim = user.getAttribute("roles");
        if (rolesClaim instanceof Collection<?> collection) {
            collection.forEach(value -> groups.add(String.valueOf(value)));
        }
        // Microsoft Entra often uses roles in a dedicated claim when configured
        Object appRoles = user.getAttribute("roles");
        if (appRoles instanceof String roleString) {
            groups.add(roleString);
        }
        Map<String, Object> attrs = user.getAttributes();
        Object wids = attrs.get("wids");
        if (wids instanceof Collection<?> collection) {
            collection.forEach(value -> groups.add(String.valueOf(value)));
        }
        return groups;
    }
}
