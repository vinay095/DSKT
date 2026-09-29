package com.deskit.service;

import com.deskit.config.RedisConfig;
import com.deskit.domain.Floor;
import com.deskit.domain.FloorMap;
import com.deskit.domain.MapChannel;
import com.deskit.domain.PublishTarget;
import com.deskit.repository.FloorMapRepository;
import com.deskit.repository.FloorRepository;
import com.deskit.web.floormap.dto.FloorMapResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FloorMapService {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final FloorMapRepository floorMapRepository;
    private final FloorRepository floorRepository;
    private final FloorService floorService;
    private final PostgisFloorSyncService postgisFloorSyncService;
    private final ObjectMapper objectMapper;

    public FloorMapService(
            FloorMapRepository floorMapRepository,
            FloorRepository floorRepository,
            FloorService floorService,
            PostgisFloorSyncService postgisFloorSyncService,
            ObjectMapper objectMapper
    ) {
        this.floorMapRepository = floorMapRepository;
        this.floorRepository = floorRepository;
        this.floorService = floorService;
        this.postgisFloorSyncService = postgisFloorSyncService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public FloorMap ensureDraft(String floorId, String name) {
        return floorMapRepository.findByFloorIdAndChannel(floorId, MapChannel.draft)
                .orElseGet(() -> floorMapRepository.save(
                        FloorMap.createDraft(floorId, name, FloorMap.emptyDocument(name))
                ));
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = RedisConfig.CACHE_FLOOR_MAPS, key = "#floorId + ':' + #channel.name()")
    public FloorMapResponse get(String floorId, MapChannel channel) {
        floorService.requireActiveFloor(floorId);
        FloorMap map = floorMapRepository.findByFloorIdAndChannel(floorId, channel)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No " + channel + " floor map for floor " + floorId
                ));
        return FloorMapResponse.from(map);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(cacheNames = RedisConfig.CACHE_FLOOR_MAPS, allEntries = true)
    })
    public FloorMapResponse saveDraftDocument(String floorId, Map<String, Object> document) {
        floorService.requireActiveFloor(floorId);
        validateDocument(document);
        FloorMap draft = ensureDraft(floorId, String.valueOf(document.getOrDefault("name", floorId)));
        draft.replaceDocument(copyMap(document));
        return FloorMapResponse.from(floorMapRepository.save(draft));
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(cacheNames = RedisConfig.CACHE_FLOOR_MAPS, allEntries = true)
    })
    public FloorMapResponse saveDraftPlan(String floorId, Map<String, Object> planDocument) {
        Floor floor = floorService.requireActiveFloor(floorId);
        FloorMap draft = ensureDraft(floorId, floor.getLabel());
        draft.replacePlanDocument(planDocument == null ? null : copyMap(planDocument));
        return FloorMapResponse.from(floorMapRepository.save(draft));
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(cacheNames = RedisConfig.CACHE_FLOOR_MAPS, allEntries = true),
            @CacheEvict(cacheNames = RedisConfig.CACHE_FLOORS, allEntries = true)
    })
    public FloorMapResponse publish(String floorId, PublishTarget target) {
        Floor floor = floorService.requireActiveFloor(floorId);
        FloorMap draft = floorMapRepository.findByFloorIdAndChannel(floorId, MapChannel.draft)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "No draft to publish"));

        boolean copySvg = target == PublishTarget.svg || target == PublishTarget.both;
        boolean copyDesk = target == PublishTarget.desk || target == PublishTarget.both;

        if (copySvg && (draft.getDocument() == null || draft.getDocument().isEmpty())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Draft SVG document is empty");
        }
        if (copyDesk && draft.getPlanDocument() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Draft desk plan is missing");
        }

        FloorMap published = floorMapRepository.findByFloorIdAndChannel(floorId, MapChannel.published)
                .orElseGet(() -> FloorMap.createPublished(floorId, floor.getLabel()));

        if (copySvg) {
            published.replaceDocument(copyMap(draft.getDocument()));
        }
        if (copyDesk) {
            published.replacePlanDocument(copyMap(draft.getPlanDocument()));
        }
        published.markPublishedBumpRelease();

        FloorMap saved = floorMapRepository.saveAndFlush(published);
        floor.setActivePublishedMapId(saved.getFloorMapId());
        floorRepository.saveAndFlush(floor);
        if (copySvg) {
            postgisFloorSyncService.syncPublishedDocument(saved.getFloorMapId(), saved.getDocument());
        }
        return FloorMapResponse.from(saved);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(cacheNames = RedisConfig.CACHE_FLOOR_MAPS, allEntries = true)
    })
    public void cloneMaps(String sourceFloorId, String targetFloorId, String targetName) {
        FloorMap sourceDraft = floorMapRepository.findByFloorIdAndChannel(sourceFloorId, MapChannel.draft)
                .orElse(null);
        Map<String, Object> draftDoc = sourceDraft != null
                ? copyMap(sourceDraft.getDocument())
                : FloorMap.emptyDocument(targetName);
        draftDoc.put("name", targetName);

        FloorMap targetDraft = FloorMap.createDraft(targetFloorId, targetName, draftDoc);
        if (sourceDraft != null && sourceDraft.getPlanDocument() != null) {
            targetDraft.replacePlanDocument(copyMap(sourceDraft.getPlanDocument()));
        }
        floorMapRepository.save(targetDraft);

        floorMapRepository.findByFloorIdAndChannel(sourceFloorId, MapChannel.published).ifPresent(sourcePub -> {
            FloorMap targetPub = FloorMap.createPublished(targetFloorId, targetName);
            targetPub.replaceDocument(copyMap(sourcePub.getDocument()));
            if (sourcePub.getPlanDocument() != null) {
                targetPub.replacePlanDocument(copyMap(sourcePub.getPlanDocument()));
            }
            targetPub.markPublishedBumpRelease();
            floorMapRepository.save(targetPub);
        });
    }

    private Map<String, Object> copyMap(Map<String, Object> source) {
        return objectMapper.convertValue(source, MAP_TYPE);
    }

    private void validateDocument(Map<String, Object> document) {
        if (document == null || document.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Document body is required");
        }
        Object version = document.get("version");
        if (!(version instanceof Number number) || number.intValue() != 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "document.version must be 2");
        }
        if (!(document.get("floor") instanceof Map<?, ?>)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "document.floor is required");
        }
        if (!(document.get("entities") instanceof List<?>)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "document.entities must be an array");
        }
    }
}
