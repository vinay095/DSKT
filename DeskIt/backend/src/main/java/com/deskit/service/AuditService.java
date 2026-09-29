package com.deskit.service;

import com.deskit.domain.AuditEvent;
import com.deskit.repository.AuditEventRepository;
import com.deskit.security.DeskItPrincipal;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final AuditEventRepository auditEventRepository;
    private final ObjectMapper objectMapper;

    public AuditService(AuditEventRepository auditEventRepository, ObjectMapper objectMapper) {
        this.auditEventRepository = auditEventRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void record(String action, String entityType, String entityId, Object before, Object after) {
        DeskItPrincipal principal = currentPrincipal();
        UUID userId = principal == null ? null : principal.getUserId();
        String empId = principal == null ? null : principal.getEmpId();

        auditEventRepository.save(AuditEvent.of(
                userId,
                empId,
                action,
                entityType,
                entityId,
                toMap(before),
                toMap(after)
        ));
    }

    private Map<String, Object> toMap(Object value) {
        if (value == null) {
            return null;
        }
        return objectMapper.convertValue(value, MAP_TYPE);
    }

    private static DeskItPrincipal currentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof DeskItPrincipal deskItPrincipal) {
            return deskItPrincipal;
        }
        return null;
    }
}
