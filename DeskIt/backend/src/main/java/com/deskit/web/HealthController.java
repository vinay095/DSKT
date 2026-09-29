package com.deskit.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/health")
@Tag(name = "Health")
public class HealthController {

    private final StringRedisTemplate redisTemplate;
    private final JdbcTemplate jdbcTemplate;
    private final String applicationName;

    public HealthController(
            StringRedisTemplate redisTemplate,
            JdbcTemplate jdbcTemplate,
            @Value("${spring.application.name}") String applicationName
    ) {
        this.redisTemplate = redisTemplate;
        this.jdbcTemplate = jdbcTemplate;
        this.applicationName = applicationName;
    }

    @GetMapping
    @Operation(summary = "API liveness probe")
    public ResponseEntity<Map<String, Object>> health() {
        String phase = null;
        try {
            phase = jdbcTemplate.queryForObject(
                    "SELECT value FROM deskit_schema_meta WHERE key = 'phase'",
                    String.class
            );
        } catch (Exception ignored) {
            // schema may not be ready yet during boot probes
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", "UP");
        body.put("service", applicationName);
        body.put("phase", phase);
        body.put("timestamp", Instant.now().toString());
        return ResponseEntity.ok(body);
    }

    @GetMapping("/ready")
    @Operation(summary = "Readiness probe (Redis ping)")
    public ResponseEntity<Map<String, Object>> ready() {
        boolean redisUp = false;
        try {
            String pong = redisTemplate.getConnectionFactory().getConnection().ping();
            redisUp = "PONG".equalsIgnoreCase(pong);
        } catch (Exception ignored) {
            redisUp = false;
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", redisUp ? "UP" : "DOWN");
        body.put("redis", redisUp ? "UP" : "DOWN");
        body.put("timestamp", Instant.now().toString());

        if (!redisUp) {
            return ResponseEntity.status(503).body(body);
        }
        return ResponseEntity.ok(body);
    }
}
