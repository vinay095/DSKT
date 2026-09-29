package com.deskit.config;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "deskit")
public class DeskItProperties {

    private final Cors cors = new Cors();
    private final Security security = new Security();
    private final Harden harden = new Harden();
    private final RateLimit rateLimit = new RateLimit();
    private final Ops ops = new Ops();

    public Cors getCors() {
        return cors;
    }

    public Security getSecurity() {
        return security;
    }

    public Harden getHarden() {
        return harden;
    }

    public RateLimit getRateLimit() {
        return rateLimit;
    }

    public Ops getOps() {
        return ops;
    }

    public static class RateLimit {
        private boolean enabled = true;
        /** Max requests per window per client IP for general API traffic. */
        private int requestsPerWindow = 120;
        private Duration window = Duration.ofMinutes(1);
        /** Stricter budget for auth endpoints (login/refresh/dev-login). */
        private int authRequestsPerWindow = 20;

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public int getRequestsPerWindow() {
            return requestsPerWindow;
        }

        public void setRequestsPerWindow(int requestsPerWindow) {
            this.requestsPerWindow = requestsPerWindow;
        }

        public Duration getWindow() {
            return window;
        }

        public void setWindow(Duration window) {
            this.window = window;
        }

        public int getAuthRequestsPerWindow() {
            return authRequestsPerWindow;
        }

        public void setAuthRequestsPerWindow(int authRequestsPerWindow) {
            this.authRequestsPerWindow = authRequestsPerWindow;
        }
    }

    public static class Ops {
        /** When false, Swagger UI / OpenAPI docs require authentication. */
        private boolean openApiPublic = true;
        /** Expose Prometheus scrape endpoint without auth (prefer network ACL in prod). */
        private boolean prometheusPublic = false;

        public boolean isOpenApiPublic() {
            return openApiPublic;
        }

        public void setOpenApiPublic(boolean openApiPublic) {
            this.openApiPublic = openApiPublic;
        }

        public boolean isPrometheusPublic() {
            return prometheusPublic;
        }

        public void setPrometheusPublic(boolean prometheusPublic) {
            this.prometheusPublic = prometheusPublic;
        }
    }

    public static class Harden {
        /** Sync published FloorDocument entities/zones/unusable into PostGIS tables. */
        private boolean postgisSyncEnabled = true;
        private String tempAssignmentExpiryCron = "0 */1 * * * *";
        private Duration idempotencyTtl = Duration.ofHours(24);
        private Duration idempotencyLockTtl = Duration.ofSeconds(30);

        public boolean isPostgisSyncEnabled() {
            return postgisSyncEnabled;
        }

        public void setPostgisSyncEnabled(boolean postgisSyncEnabled) {
            this.postgisSyncEnabled = postgisSyncEnabled;
        }

        public String getTempAssignmentExpiryCron() {
            return tempAssignmentExpiryCron;
        }

        public void setTempAssignmentExpiryCron(String tempAssignmentExpiryCron) {
            this.tempAssignmentExpiryCron = tempAssignmentExpiryCron;
        }

        public Duration getIdempotencyTtl() {
            return idempotencyTtl;
        }

        public void setIdempotencyTtl(Duration idempotencyTtl) {
            this.idempotencyTtl = idempotencyTtl;
        }

        public Duration getIdempotencyLockTtl() {
            return idempotencyLockTtl;
        }

        public void setIdempotencyLockTtl(Duration idempotencyLockTtl) {
            this.idempotencyLockTtl = idempotencyLockTtl;
        }
    }

    public static class Cors {
        private String allowedOrigins = "http://localhost:5173,http://localhost:5174";

        public String getAllowedOrigins() {
            return allowedOrigins;
        }

        public void setAllowedOrigins(String allowedOrigins) {
            this.allowedOrigins = allowedOrigins;
        }

        public List<String> allowedOriginList() {
            return Arrays.stream(allowedOrigins.split(","))
                    .map(String::trim)
                    .filter(origin -> !origin.isEmpty())
                    .toList();
        }
    }

    public static class Security {
        private final Jwt jwt = new Jwt();
        private final Oauth2 oauth2 = new Oauth2();
        private String defaultRole = "EMPLOYEE";
        private List<String> adminEmailAllowlist = new ArrayList<>();
        private Map<String, Map<String, String>> roleMapping = new HashMap<>();
        private boolean devLoginEnabled = false;

        public Jwt getJwt() {
            return jwt;
        }

        public Oauth2 getOauth2() {
            return oauth2;
        }

        public String getDefaultRole() {
            return defaultRole;
        }

        public void setDefaultRole(String defaultRole) {
            this.defaultRole = defaultRole;
        }

        public List<String> getAdminEmailAllowlist() {
            return adminEmailAllowlist;
        }

        public void setAdminEmailAllowlist(List<String> adminEmailAllowlist) {
            this.adminEmailAllowlist = adminEmailAllowlist;
        }

        public Map<String, Map<String, String>> getRoleMapping() {
            return roleMapping;
        }

        public void setRoleMapping(Map<String, Map<String, String>> roleMapping) {
            this.roleMapping = roleMapping;
        }

        public boolean isDevLoginEnabled() {
            return devLoginEnabled;
        }

        public void setDevLoginEnabled(boolean devLoginEnabled) {
            this.devLoginEnabled = devLoginEnabled;
        }
    }

    public static class Jwt {
        private String secret = "change-me-deskit-phase1-jwt-secret-key-32b-min";
        private String issuer = "deskit-backend";
        private Duration accessTokenTtl = Duration.ofMinutes(15);
        private Duration refreshTokenTtl = Duration.ofDays(7);

        public String getSecret() {
            return secret;
        }

        public void setSecret(String secret) {
            this.secret = secret;
        }

        public String getIssuer() {
            return issuer;
        }

        public void setIssuer(String issuer) {
            this.issuer = issuer;
        }

        public Duration getAccessTokenTtl() {
            return accessTokenTtl;
        }

        public void setAccessTokenTtl(Duration accessTokenTtl) {
            this.accessTokenTtl = accessTokenTtl;
        }

        public Duration getRefreshTokenTtl() {
            return refreshTokenTtl;
        }

        public void setRefreshTokenTtl(Duration refreshTokenTtl) {
            this.refreshTokenTtl = refreshTokenTtl;
        }
    }

    public static class Oauth2 {
        private String frontendRedirectUrl = "http://localhost:5173/auth/callback";

        public String getFrontendRedirectUrl() {
            return frontendRedirectUrl;
        }

        public void setFrontendRedirectUrl(String frontendRedirectUrl) {
            this.frontendRedirectUrl = frontendRedirectUrl;
        }
    }
}
