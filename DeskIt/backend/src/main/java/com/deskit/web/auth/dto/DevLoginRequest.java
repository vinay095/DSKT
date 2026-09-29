package com.deskit.web.auth.dto;

import com.deskit.domain.AppRole;
import jakarta.validation.constraints.AssertTrue;

public record DevLoginRequest(
        String email,
        AppRole role
) {
    @AssertTrue(message = "Provide either email or role")
    public boolean isValid() {
        boolean hasEmail = email != null && !email.isBlank();
        boolean hasRole = role != null;
        return hasEmail ^ hasRole;
    }
}
