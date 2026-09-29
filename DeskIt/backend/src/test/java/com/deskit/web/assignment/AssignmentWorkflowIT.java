package com.deskit.web.assignment;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.deskit.support.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@AutoConfigureMockMvc
class AssignmentWorkflowIT extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void hrCanAssignUnassignAndEmployeeCannotAssign() throws Exception {
        jdbcTemplate.update(
                "UPDATE seat_assignments SET status = 'revoked' WHERE floor_id = 'floor-4' AND status = 'active'"
        );
        String hr = login("{\"role\":\"HR\"}");
        String employee = login("{\"role\":\"EMPLOYEE\"}");

        mockMvc.perform(post("/api/v1/floors/floor-4/assignments")
                        .header("Authorization", "Bearer " + employee)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"deskCode":"A-101","empId":"EMP-1304","assignmentType":"permanent"}
                                """))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/floors/floor-4/assignments")
                        .header("Authorization", "Bearer " + hr)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"deskCode":"A-101","empId":"EMP-1304","assignmentType":"permanent"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.deskCode").value("A-101"))
                .andExpect(jsonPath("$.status").value("active"));

        mockMvc.perform(get("/api/v1/floors/floor-4/assignments")
                        .header("Authorization", "Bearer " + employee))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        mockMvc.perform(get("/api/v1/employees/EMP-1304/assignments")
                        .header("Authorization", "Bearer " + hr))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].deskCode").value("A-101"));

        // Reassign same desk to another employee — previous revoked
        mockMvc.perform(post("/api/v1/floors/floor-4/assignments")
                        .header("Authorization", "Bearer " + hr)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"deskCode":"A-101","empId":"EMP-1401","assignmentType":"permanent"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.empId").value("EMP-1401"));

        mockMvc.perform(get("/api/v1/floors/floor-4/assignments")
                        .header("Authorization", "Bearer " + hr))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].empId").value("EMP-1401"));

        mockMvc.perform(delete("/api/v1/floors/floor-4/assignments/A-101")
                        .header("Authorization", "Bearer " + hr))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/floors/floor-4/assignments")
                        .header("Authorization", "Bearer " + hr))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        Integer audits = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM audit_events WHERE action IN ('SEAT_ASSIGN','SEAT_UNASSIGN')",
                Integer.class
        );
        org.assertj.core.api.Assertions.assertThat(audits).isGreaterThanOrEqualTo(3);
    }

    @Test
    void seatRequestApproveFlow() throws Exception {
        String hr = login("{\"role\":\"HR\"}");

        mockMvc.perform(get("/api/v1/seat-requests").param("status", "pending")
                        .header("Authorization", "Bearer " + hr))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].empId").value("EMP-1401"));

        String requestId = "33333333-3333-3333-3333-333333333301";
        mockMvc.perform(patch("/api/v1/seat-requests/" + requestId)
                        .header("Authorization", "Bearer " + hr)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"approved\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("approved"));
    }

    @Test
    void floorChangeRequestHrSubmitAdminReview() throws Exception {
        String hr = login("{\"role\":\"HR\"}");
        String admin = login("{\"role\":\"ADMIN\"}");
        String employee = login("{\"role\":\"EMPLOYEE\"}");

        mockMvc.perform(post("/api/v1/floor-change-requests")
                        .header("Authorization", "Bearer " + employee)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "requestType":"add",
                                  "elementDescription":"Extra meeting room",
                                  "details":"Near engineering zone",
                                  "floorId":"floor-4"
                                }
                                """))
                .andExpect(status().isForbidden());

        MvcResult created = mockMvc.perform(post("/api/v1/floor-change-requests")
                        .header("Authorization", "Bearer " + hr)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "requestType":"add",
                                  "elementDescription":"Extra meeting room",
                                  "details":"Near engineering zone",
                                  "floorId":"floor-4"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("pending"))
                .andExpect(jsonPath("$.requestedByEmpId").value("EMP-1305"))
                .andReturn();

        JsonNode body = objectMapper.readTree(created.getResponse().getContentAsString());
        String id = body.get("id").asText();

        mockMvc.perform(patch("/api/v1/floor-change-requests/" + id)
                        .header("Authorization", "Bearer " + hr)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"acknowledged\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/v1/floor-change-requests/" + id)
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"acknowledged\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("acknowledged"));
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
