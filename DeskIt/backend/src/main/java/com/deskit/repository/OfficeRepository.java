package com.deskit.repository;

import com.deskit.domain.Office;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OfficeRepository extends JpaRepository<Office, String> {

    List<Office> findByActiveTrueAndDeletedAtIsNullOrderByNameAsc();

    Optional<Office> findByIdAndActiveTrueAndDeletedAtIsNull(String id);
}
