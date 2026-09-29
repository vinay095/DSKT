package com.deskit.web.org.dto;

import com.deskit.domain.Office;
import java.util.UUID;

public record OfficeResponse(
        String id,
        UUID orgId,
        String name,
        String city,
        String country,
        String timezone
) {
    public static OfficeResponse from(Office office) {
        return new OfficeResponse(
                office.getId(),
                office.getOrgId(),
                office.getName(),
                office.getCity(),
                office.getCountry(),
                office.getTimezone()
        );
    }
}
