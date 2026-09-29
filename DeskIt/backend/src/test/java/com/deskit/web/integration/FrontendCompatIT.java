package com.deskit.web.integration;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.deskit.support.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@AutoConfigureMockMvc
class FrontendCompatIT extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void devLoginAcceptsLowercaseRoleAndExposesFrontendRole() throws Exception {
        mockMvc.perform(post("/api/v1/auth/dev-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"admin\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role").value("admin"))
                .andExpect(jsonPath("$.user.roles[0]").value("ADMIN"))
                .andExpect(jsonPath("$.user.empId").value("EMP-1306"));
    }

    @Test
    void workspacesCompatListsFloorsAsSnakeCase() throws Exception {
        String token = login("{\"role\":\"employee\"}");
        mockMvc.perform(get("/api/v1/workspaces")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].workspace_id").exists())
                .andExpect(jsonPath("$[0].active_floor_map_id").exists())
                .andExpect(jsonPath("$[0].floor_id").exists());

        mockMvc.perform(get("/api/v1/workspaces/floor-4")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workspace_id").value("floor-4"))
                .andExpect(jsonPath("$.city").value("Noida"));
    }

    @Test
    void assignAcceptsSnakeCasePayloadAndAdminRole() throws Exception {
        jdbcTemplate.update(
                "UPDATE seat_assignments SET status = 'revoked' WHERE floor_id = 'floor-4' AND status = 'active'"
        );
        String admin = login("{\"role\":\"admin\"}");

        mockMvc.perform(post("/api/v1/floors/fmap-pub-floor-4/assignments")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "desk_code":"A-202",
                                  "emp_id":"EMP-1304",
                                  "assignment_type":"temporary",
                                  "is_temporary":true,
                                  "start_date":"2030-01-01",
                                  "end_date":"2030-01-15",
                                  "notes":"compat"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.deskCode").value("A-202"))
                .andExpect(jsonPath("$.desk_code").value("A-202"))
                .andExpect(jsonPath("$.is_temporary").value(true))
                .andExpect(jsonPath("$.emp_id").value("EMP-1304"));
    }

    @Test
    void elementTypesExposeLegacyNestedShape() throws Exception {
        String token = login("{\"role\":\"hr\"}");
        mockMvc.perform(get("/api/v1/element-types")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].element_id").exists())
                .andExpect(jsonPath("$[0].dimensions.widthFinest").exists())
                .andExpect(jsonPath("$[0].associated_ui.color").exists());
    }

    private String login(String body) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/dev-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }
}
