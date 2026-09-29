package com.deskit.security;

import com.deskit.config.DeskItProperties;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
public class RefreshTokenStore {

    private static final String KEY_PREFIX = "deskit:refresh:";

    private final StringRedisTemplate redisTemplate;
    private final Duration ttl;

    public RefreshTokenStore(StringRedisTemplate redisTemplate, DeskItProperties properties) {
        this.redisTemplate = redisTemplate;
        this.ttl = properties.getSecurity().getJwt().getRefreshTokenTtl();
    }

    public String issue(UUID userId) {
        String token = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set(KEY_PREFIX + token, userId.toString(), ttl);
        return token;
    }

    public Optional<UUID> resolveUserId(String refreshToken) {
        String value = redisTemplate.opsForValue().get(KEY_PREFIX + refreshToken);
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }
        return Optional.of(UUID.fromString(value));
    }

    public void revoke(String refreshToken) {
        redisTemplate.delete(KEY_PREFIX + refreshToken);
    }

    public void rotate(String oldToken, String newToken, UUID userId) {
        revoke(oldToken);
        redisTemplate.opsForValue().set(KEY_PREFIX + newToken, userId.toString(), ttl);
    }
}
