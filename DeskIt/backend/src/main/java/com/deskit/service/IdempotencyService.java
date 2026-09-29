package com.deskit.service;

import com.deskit.config.DeskItProperties;
import com.deskit.domain.IdempotencyKeyEntity;
import com.deskit.repository.IdempotencyKeyRepository;
import com.deskit.security.DeskItPrincipal;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class IdempotencyService {

    private final IdempotencyKeyRepository idempotencyKeyRepository;
    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;
    private final DeskItProperties properties;

    public IdempotencyService(
            IdempotencyKeyRepository idempotencyKeyRepository,
            StringRedisTemplate stringRedisTemplate,
            ObjectMapper objectMapper,
            DeskItProperties properties
    ) {
        this.idempotencyKeyRepository = idempotencyKeyRepository;
        this.stringRedisTemplate = stringRedisTemplate;
        this.objectMapper = objectMapper;
        this.properties = properties;
    }

    @Transactional
    public <T> ResponseEntity<T> execute(
            String idempotencyKey,
            String method,
            String path,
            Object requestBody,
            Class<T> responseType,
            HttpStatus successStatus,
            Supplier<T> action
    ) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return ResponseEntity.status(successStatus).body(action.get());
        }

        String key = idempotencyKey.trim();
        if (key.length() > 128) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Idempotency-Key too long (max 128)");
        }

        String requestHash = hashRequest(requestBody);
        var existing = idempotencyKeyRepository.findByIdempotencyKeyAndHttpMethodAndRequestPath(key, method, path);
        if (existing.isPresent()) {
            IdempotencyKeyEntity record = existing.get();
            if (record.getExpiresAt().isBefore(Instant.now())) {
                idempotencyKeyRepository.delete(record);
            } else {
                return replay(record, requestHash, responseType);
            }
        }

        String lockKey = "deskit:idempotency:lock:" + method + ":" + path + ":" + key;
        Boolean locked = stringRedisTemplate.opsForValue().setIfAbsent(
                lockKey,
                "1",
                properties.getHarden().getIdempotencyLockTtl().toMillis(),
                TimeUnit.MILLISECONDS
        );
        if (Boolean.FALSE.equals(locked)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Request with this Idempotency-Key is already in progress"
            );
        }

        try {
            existing = idempotencyKeyRepository.findByIdempotencyKeyAndHttpMethodAndRequestPath(key, method, path);
            if (existing.isPresent() && existing.get().getExpiresAt().isAfter(Instant.now())) {
                return replay(existing.get(), requestHash, responseType);
            }

            T result = action.get();
            JsonNode bodyJson = objectMapper.valueToTree(result);
            idempotencyKeyRepository.save(IdempotencyKeyEntity.create(
                    key,
                    currentUserId(),
                    method,
                    path,
                    requestHash,
                    successStatus.value(),
                    bodyJson,
                    Instant.now().plus(properties.getHarden().getIdempotencyTtl())
            ));
            return ResponseEntity.status(successStatus).body(result);
        } finally {
            stringRedisTemplate.delete(lockKey);
        }
    }

    private <T> ResponseEntity<T> replay(IdempotencyKeyEntity record, String requestHash, Class<T> responseType) {
        if (!record.getRequestHash().equals(requestHash)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Idempotency-Key reused with a different request body"
            );
        }
        T body = objectMapper.convertValue(record.getResponseBody(), responseType);
        return ResponseEntity.status(record.getResponseStatus()).body(body);
    }

    private UUID currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof DeskItPrincipal principal) {
            return principal.getUserId();
        }
        return null;
    }

    private String hashRequest(Object requestBody) {
        try {
            byte[] payload = objectMapper.writeValueAsBytes(requestBody == null ? "" : requestBody);
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(payload));
        } catch (JsonProcessingException | NoSuchAlgorithmException ex) {
            throw new IllegalStateException("Failed to hash idempotent request", ex);
        }
    }
}
