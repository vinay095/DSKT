package com.deskit.service;

import com.deskit.repository.ElementTypeRepository;
import com.deskit.web.floormap.dto.ElementTypeResponse;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ElementTypeService {

    private final ElementTypeRepository elementTypeRepository;

    public ElementTypeService(ElementTypeRepository elementTypeRepository) {
        this.elementTypeRepository = elementTypeRepository;
    }

    /**
     * Catalog is small and shape-sensitive for API clients; read through DB
     * (avoid Redis typed-JSON breakage when the DTO evolves).
     */
    @Transactional(readOnly = true)
    public List<ElementTypeResponse> listAll() {
        return elementTypeRepository.findAllWithPredefined().stream()
                .map(ElementTypeResponse::from)
                .toList();
    }
}
