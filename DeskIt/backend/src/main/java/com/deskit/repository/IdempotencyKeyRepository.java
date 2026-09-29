package com.deskit.repository;

import com.deskit.domain.IdempotencyKeyEntity;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface IdempotencyKeyRepository extends JpaRepository<IdempotencyKeyEntity, Long> {

    Optional<IdempotencyKeyEntity> findByIdempotencyKeyAndHttpMethodAndRequestPath(
            String idempotencyKey,
            String httpMethod,
            String requestPath
    );

    @Modifying
    @Query("delete from IdempotencyKeyEntity e where e.expiresAt < :now")
    int deleteExpired(@Param("now") Instant now);
}
