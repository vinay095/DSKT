package com.deskit.service;

import com.deskit.config.RedisConfig;
import com.deskit.domain.Floor;
import com.deskit.repository.FloorRepository;
import com.deskit.web.org.dto.CloneFloorRequest;
import com.deskit.web.org.dto.CreateFloorRequest;
import com.deskit.web.org.dto.FloorResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FloorService {

    private final FloorRepository floorRepository;
    private final OfficeService officeService;
    private final ObjectProvider<FloorMapService> floorMapService;

    public FloorService(
            FloorRepository floorRepository,
            OfficeService officeService,
            ObjectProvider<FloorMapService> floorMapService
    ) {
        this.floorRepository = floorRepository;
        this.officeService = officeService;
        this.floorMapService = floorMapService;
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = RedisConfig.CACHE_FLOORS, key = "'all'")
    public List<FloorResponse> listAll() {
        return floorRepository.findByActiveTrueAndDeletedAtIsNullOrderByLabelAsc().stream()
                .map(FloorResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = RedisConfig.CACHE_FLOORS, key = "'office:' + #officeId")
    public List<FloorResponse> listByOffice(String officeId) {
        officeService.requireActiveOffice(officeId);
        return floorRepository.findByOfficeIdAndActiveTrueAndDeletedAtIsNullOrderByLabelAsc(officeId).stream()
                .map(FloorResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = RedisConfig.CACHE_FLOORS, key = "#id")
    public FloorResponse getFloor(String id) {
        return FloorResponse.from(requireActiveFloor(id));
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(cacheNames = RedisConfig.CACHE_FLOORS, allEntries = true)
    })
    public FloorResponse create(CreateFloorRequest request) {
        officeService.requireActiveOffice(request.officeId());
        String id = "floor-" + UUID.randomUUID().toString().substring(0, 8);
        Floor floor = Floor.create(
                id,
                request.officeId(),
                request.label().trim(),
                request.shortLabel().trim(),
                request.locationLabel().trim(),
                blankToNull(request.block()),
                blankToNull(request.building()),
                null,
                true
        );
        Floor saved = floorRepository.save(floor);
        floorMapService.getObject().ensureDraft(saved.getId(), saved.getLabel());
        return FloorResponse.from(saved);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(cacheNames = RedisConfig.CACHE_FLOORS, allEntries = true),
            @CacheEvict(cacheNames = RedisConfig.CACHE_FLOOR_MAPS, allEntries = true)
    })
    public FloorResponse cloneFloor(String sourceId, CloneFloorRequest request) {
        Floor source = requireActiveFloor(sourceId);
        String officeId = request.officeId() == null || request.officeId().isBlank()
                ? source.getOfficeId()
                : request.officeId().trim();
        officeService.requireActiveOffice(officeId);

        String locationLabel = request.locationLabel() == null || request.locationLabel().isBlank()
                ? request.label().trim()
                : request.locationLabel().trim();

        String id = "floor-" + UUID.randomUUID().toString().substring(0, 8);
        Floor clone = Floor.create(
                id,
                officeId,
                request.label().trim(),
                request.shortLabel().trim(),
                locationLabel,
                source.getBlock(),
                source.getBuilding(),
                source.getId(),
                true
        );
        Floor saved = floorRepository.save(clone);
        floorMapService.getObject().cloneMaps(sourceId, saved.getId(), saved.getLabel());
        return FloorResponse.from(saved);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(cacheNames = RedisConfig.CACHE_FLOORS, allEntries = true),
            @CacheEvict(cacheNames = RedisConfig.CACHE_FLOOR_MAPS, allEntries = true)
    })
    public void deleteCustomFloor(String id) {
        Floor floor = requireActiveFloor(id);
        if (!floor.isCustom()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only custom floors can be deleted");
        }
        floor.softDelete();
        floorRepository.save(floor);
    }

    @Transactional(readOnly = true)
    public Floor requireActiveFloor(String id) {
        return floorRepository.findByIdAndActiveTrueAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Floor not found: " + id));
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
