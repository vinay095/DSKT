package com.deskit.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import java.util.Locale;

public enum MapChannel {
    draft,
    published;

    @JsonCreator
    public static MapChannel fromJson(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return MapChannel.valueOf(value.trim().toLowerCase(Locale.ROOT));
    }
}
