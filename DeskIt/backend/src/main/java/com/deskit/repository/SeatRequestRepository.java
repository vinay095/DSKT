package com.deskit.repository;

import com.deskit.domain.SeatRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SeatRequestRepository extends JpaRepository<SeatRequest, UUID> {

    List<SeatRequest> findByStatusOrderByCreatedAtDesc(SeatRequest.Status status);

    List<SeatRequest> findAllByOrderByCreatedAtDesc();
}
