package com.deskit.web.filter;

import com.deskit.config.DeskItProperties;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.TimeUnit;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Redis fixed-window rate limiter keyed by client IP (+ path class).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class RateLimitFilter extends OncePerRequestFilter {

    private final DeskItProperties properties;
    private final StringRedisTemplate redisTemplate;
    private final Counter rejectedCounter;

    public RateLimitFilter(
            DeskItProperties properties,
            StringRedisTemplate redisTemplate,
            MeterRegistry meterRegistry
    ) {
        this.properties = properties;
        this.redisTemplate = redisTemplate;
        this.rejectedCounter = meterRegistry.counter("deskit.rate_limit.rejected");
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!properties.getRateLimit().isEnabled()) {
            return true;
        }
        String path = request.getRequestURI();
        return path.startsWith("/actuator/health")
                || path.startsWith("/api/v1/health");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String client = clientKey(request);
        boolean authPath = isAuthPath(request.getRequestURI());
        int limit = authPath
                ? properties.getRateLimit().getAuthRequestsPerWindow()
                : properties.getRateLimit().getRequestsPerWindow();
        Duration window = properties.getRateLimit().getWindow();

        String redisKey = "deskit:ratelimit:" + (authPath ? "auth:" : "api:") + client;
        Long count;
        try {
            count = redisTemplate.opsForValue().increment(redisKey);
            if (count != null && count == 1L) {
                redisTemplate.expire(redisKey, window.toMillis(), TimeUnit.MILLISECONDS);
            }
        } catch (Exception ex) {
            // Fail open if Redis is briefly unavailable (readiness still reports DOWN)
            filterChain.doFilter(request, response);
            return;
        }

        if (count != null && count > limit) {
            rejectedCounter.increment();
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
            response.setHeader("Retry-After", String.valueOf(Math.max(1, window.toSeconds())));
            response.getWriter().write(
                    "{\"type\":\"about:blank\",\"title\":\"Too Many Requests\",\"status\":429,"
                            + "\"detail\":\"Rate limit exceeded. Try again later.\"}"
            );
            return;
        }

        if (count != null) {
            response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
            response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, limit - count)));
        }
        filterChain.doFilter(request, response);
    }

    private static boolean isAuthPath(String path) {
        return path.startsWith("/api/v1/auth/")
                || path.startsWith("/oauth2/")
                || path.startsWith("/login/oauth2/");
    }

    private static String clientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String remote = request.getRemoteAddr();
        return remote == null || remote.isBlank() ? "unknown" : remote;
    }
}
