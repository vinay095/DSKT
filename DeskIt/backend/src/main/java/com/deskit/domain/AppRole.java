package com.deskit.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Collection;
import java.util.Comparator;
import java.util.Locale;
import java.util.Set;

public enum AppRole {
    EMPLOYEE,
    HR,
    ADMIN;

    public String asAuthority() {
        return "ROLE_" + name();
    }

    /** Lowercase form used by the DeskIt frontend (`employee` | `hr` | `admin`). */
    public String asFrontendRole() {
        return name().toLowerCase(Locale.ROOT);
    }

    @JsonValue
    public String jsonValue() {
        return name();
    }

    @JsonCreator
    public static AppRole fromJson(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim();
        if (normalized.regionMatches(true, 0, "ROLE_", 0, 5)) {
            normalized = normalized.substring(5);
        }
        return AppRole.valueOf(normalized.toUpperCase(Locale.ROOT));
    }

    public static AppRole fromAuthority(String authority) {
        return fromJson(authority);
    }

    /** Highest-privilege role for UI primary-role mapping: ADMIN &gt; HR &gt; EMPLOYEE. */
    public static AppRole primaryOf(Collection<AppRole> roles) {
        if (roles == null || roles.isEmpty()) {
            return EMPLOYEE;
        }
        return roles.stream()
                .max(Comparator.comparingInt(AppRole::rank))
                .orElse(EMPLOYEE);
    }

    private int rank() {
        return switch (this) {
            case ADMIN -> 3;
            case HR -> 2;
            case EMPLOYEE -> 1;
        };
    }

    public static Set<AppRole> seatingMutators() {
        return Set.of(HR, ADMIN);
    }
}
