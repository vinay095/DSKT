package com.deskit.repository;

import com.deskit.domain.SeatAssignment;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SeatAssignmentRepository extends JpaRepository<SeatAssignment, UUID> {

    List<SeatAssignment> findByFloorIdAndStatusOrderByAssignedAtDesc(String floorId, SeatAssignment.Status status);

    List<SeatAssignment> findByEmpIdAndStatusOrderByAssignedAtDesc(String empId, SeatAssignment.Status status);

    Optional<SeatAssignment> findByFloorIdAndDeskCodeAndStatus(
            String floorId,
            String deskCode,
            SeatAssignment.Status status
    );

    Optional<SeatAssignment> findByFloorIdAndDeskObjectIdAndStatus(
            String floorId,
            String deskObjectId,
            SeatAssignment.Status status
    );

    List<SeatAssignment> findByStatusAndTemporaryTrueAndEndDateBefore(
            SeatAssignment.Status status,
            Instant endDate
    );
}
