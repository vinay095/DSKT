package com.deskit.repository;

import com.deskit.domain.FloorMap;
import com.deskit.domain.MapChannel;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FloorMapRepository extends JpaRepository<FloorMap, String> {

    Optional<FloorMap> findByFloorIdAndChannel(String floorId, MapChannel channel);

    boolean existsByFloorIdAndChannel(String floorId, MapChannel channel);
}
