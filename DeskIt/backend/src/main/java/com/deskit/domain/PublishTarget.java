package com.deskit.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import java.util.Locale;

public enum PublishTarget {
    svg,
    desk,
    both;

    @JsonCreator
    public static PublishTarget fromJson(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return PublishTarget.valueOf(value.trim().toLowerCase(Locale.ROOT));
    }
}
