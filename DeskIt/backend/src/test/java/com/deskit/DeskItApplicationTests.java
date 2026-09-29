package com.deskit;

import static org.assertj.core.api.Assertions.assertThat;

import com.deskit.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

class DeskItApplicationTests extends AbstractIntegrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void contextLoads() {
        assertThat(jdbcTemplate).isNotNull();
    }

    @Test
    void flywayBaselineApplied() {
        String phase = jdbcTemplate.queryForObject(
                "SELECT value FROM deskit_schema_meta WHERE key = 'phase'",
                String.class
        );
        assertThat(phase).isEqualTo("6");
    }

    @Test
    void seedUsersPresent() {
        Integer users = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM app_users", Integer.class);
        Integer roles = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM user_roles", Integer.class);
        assertThat(users).isEqualTo(3);
        assertThat(roles).isEqualTo(3);
    }

    @Test
    void officesAndFloorsSeeded() {
        Integer offices = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM offices", Integer.class);
        Integer floors = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM floors", Integer.class);
        Integer employees = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM employees", Integer.class);
        Integer drafts = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM floor_maps WHERE channel = 'draft'",
                Integer.class
        );
        assertThat(offices).isEqualTo(5);
        assertThat(floors).isEqualTo(7);
        assertThat(employees).isEqualTo(8);
        assertThat(drafts).isEqualTo(7);
    }

    @Test
    void postgisExtensionEnabled() {
        Boolean installed = jdbcTemplate.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis')",
                Boolean.class
        );
        assertThat(installed).isTrue();
    }
}
