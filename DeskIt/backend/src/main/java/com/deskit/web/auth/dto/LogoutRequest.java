package com.deskit.web.auth.dto;

public record LogoutRequest(
        String refreshToken
) {
}
