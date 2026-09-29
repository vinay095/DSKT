package com.deskit.config;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;

/**
 * Loads {@code .env} from the process working directory (and {@code backend/.env} /
 * {@code DeskIt/backend/.env} when run from a parent folder) into the Spring Environment.
 * <p>
 * Maps common {@code SCREAMING_SNAKE} keys onto Spring property names (so
 * {@code SPRING_PROFILES_ACTIVE} actually activates profiles — a plain MapPropertySource
 * does not get OS-env relaxed binding). OS / CI environment variables still win.
 */
public class DotEnvEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Map<String, Object> values = new LinkedHashMap<>();
        loadFile(Path.of(".env"), values);
        loadFile(Path.of("backend/.env"), values);
        loadFile(Path.of("DeskIt/backend/.env"), values);
        if (values.isEmpty()) {
            return;
        }
        normalizeSpringKeys(values);
        // Ahead of application.yml defaults, behind real OS environment.
        String relative = StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME;
        if (environment.getPropertySources().contains(relative)) {
            environment.getPropertySources().addAfter(relative, new MapPropertySource("deskitDotEnv", values));
        } else {
            environment.getPropertySources().addFirst(new MapPropertySource("deskitDotEnv", values));
        }
    }

    private static void normalizeSpringKeys(Map<String, Object> values) {
        copyIfAbsent(values, "SPRING_PROFILES_ACTIVE", "spring.profiles.active");
        copyIfAbsent(values, "SERVER_PORT", "server.port");
        copyIfAbsent(values, "DATABASE_URL", "spring.datasource.url");
        copyIfAbsent(values, "DATABASE_USERNAME", "spring.datasource.username");
        copyIfAbsent(values, "DATABASE_PASSWORD", "spring.datasource.password");
        copyIfAbsent(values, "REDIS_HOST", "spring.data.redis.host");
        copyIfAbsent(values, "REDIS_PORT", "spring.data.redis.port");
        copyIfAbsent(values, "REDIS_PASSWORD", "spring.data.redis.password");
    }

    private static void copyIfAbsent(Map<String, Object> values, String from, String to) {
        if (values.containsKey(from) && !values.containsKey(to)) {
            values.put(to, values.get(from));
        }
    }

    private static void loadFile(Path path, Map<String, Object> into) {
        if (!Files.isRegularFile(path)) {
            return;
        }
        try (BufferedReader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
            String line;
            while ((line = reader.readLine()) != null) {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                    continue;
                }
                int eq = trimmed.indexOf('=');
                if (eq <= 0) {
                    continue;
                }
                String key = trimmed.substring(0, eq).trim();
                String value = trimmed.substring(eq + 1).trim();
                if ((value.startsWith("\"") && value.endsWith("\""))
                        || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.substring(1, value.length() - 1);
                }
                if (System.getenv(key) != null) {
                    continue; // OS env wins
                }
                into.putIfAbsent(key, value);
            }
        } catch (IOException ignored) {
            // ignore unreadable .env
        }
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }
}
