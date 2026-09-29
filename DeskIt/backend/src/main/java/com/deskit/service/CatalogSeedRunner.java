package com.deskit.service;

import com.deskit.config.RedisConfig;
import com.deskit.domain.ElementType;
import com.deskit.domain.PredefinedElementType;
import com.deskit.repository.ElementTypeRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.cache.CacheManager;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Keeps {@code element_types} in sync with creator {@code library-catalog.json}.
 * Inserts any missing predefined types on startup (safe for pulled catalog growth).
 */
@Component
@Order(100)
public class CatalogSeedRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(CatalogSeedRunner.class);

    private final ElementTypeRepository elementTypeRepository;
    private final ObjectMapper objectMapper;
    private final CacheManager cacheManager;

    public CatalogSeedRunner(
            ElementTypeRepository elementTypeRepository,
            ObjectMapper objectMapper,
            CacheManager cacheManager
    ) {
        this.elementTypeRepository = elementTypeRepository;
        this.objectMapper = objectMapper;
        this.cacheManager = cacheManager;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        ClassPathResource resource = new ClassPathResource("catalog/library-catalog.json");
        if (!resource.exists()) {
            log.warn("Catalog sync skipped: classpath:catalog/library-catalog.json not found");
            return;
        }

        JsonNode root = objectMapper.readTree(resource.getInputStream());
        JsonNode categories = root.get("categories");
        if (categories == null || !categories.isArray()) {
            log.warn("Catalog sync skipped: invalid catalog format");
            return;
        }

        int inserted = 0;
        for (JsonNode categoryNode : categories) {
            String category = text(categoryNode, "category");
            JsonNode types = categoryNode.get("types");
            if (category == null || types == null || !types.isArray()) {
                continue;
            }
            for (JsonNode typeNode : types) {
                String elementType = text(typeNode, "elementType");
                String label = text(typeNode, "label");
                String svg = text(typeNode, "svg");
                if (elementType == null || label == null) {
                    continue;
                }
                String elementId = category + ":" + elementType;
                if (elementTypeRepository.existsByElementId(elementId)) {
                    continue;
                }

                ElementType entity = ElementType.create(elementId, label, category);
                int width = typeNode.path("widthCells").asInt(1);
                int height = typeNode.path("heightCells").asInt(1);
                String color = text(typeNode, "color");
                String svgPath = svg == null ? null : "catalog-assets/" + svg;
                entity.setPredefined(PredefinedElementType.create(width, height, color, svgPath));
                elementTypeRepository.save(entity);
                inserted++;
            }
        }
        if (inserted > 0) {
            var cache = cacheManager.getCache(RedisConfig.CACHE_ELEMENT_TYPES);
            if (cache != null) {
                cache.clear();
            }
            log.info("Catalog sync inserted {} predefined element types from library-catalog.json", inserted);
        } else {
            log.debug("Catalog sync: no new element types to insert");
        }
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value == null || value.isNull() ? null : value.asText();
    }
}
