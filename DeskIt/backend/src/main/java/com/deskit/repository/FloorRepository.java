package com.deskit.repository;

import com.deskit.domain.Floor;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FloorRepository extends JpaRepository<Floor, String> {

    List<Floor> findByActiveTrueAndDeletedAtIsNullOrderByLabelAsc();

    List<Floor> findByOfficeIdAndActiveTrueAndDeletedAtIsNullOrderByLabelAsc(String officeId);

    Optional<Floor> findByIdAndActiveTrueAndDeletedAtIsNull(String id);

    boolean existsByIdAndActiveTrueAndDeletedAtIsNull(String id);
}
