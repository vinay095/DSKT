package com.deskit.service;

import com.deskit.config.RedisConfig;
import com.deskit.domain.Office;
import com.deskit.repository.OfficeRepository;
import com.deskit.web.org.dto.OfficeResponse;
import java.util.List;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OfficeService {

    private final OfficeRepository officeRepository;

    public OfficeService(OfficeRepository officeRepository) {
        this.officeRepository = officeRepository;
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = RedisConfig.CACHE_OFFICES, key = "'all'")
    public List<OfficeResponse> listOffices() {
        return officeRepository.findByActiveTrueAndDeletedAtIsNullOrderByNameAsc().stream()
                .map(OfficeResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = RedisConfig.CACHE_OFFICES, key = "#id")
    public OfficeResponse getOffice(String id) {
        Office office = officeRepository.findByIdAndActiveTrueAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Office not found: " + id));
        return OfficeResponse.from(office);
    }

    @Transactional(readOnly = true)
    public Office requireActiveOffice(String id) {
        return officeRepository.findByIdAndActiveTrueAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Office not found: " + id));
    }
}
