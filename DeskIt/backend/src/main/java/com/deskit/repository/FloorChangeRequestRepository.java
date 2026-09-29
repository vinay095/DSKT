package com.deskit.repository;

import com.deskit.domain.FloorChangeRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FloorChangeRequestRepository extends JpaRepository<FloorChangeRequest, UUID> {

    List<FloorChangeRequest> findByStatusOrderByCreatedAtDesc(FloorChangeRequest.Status status);

    List<FloorChangeRequest> findAllByOrderByCreatedAtDesc();
}
