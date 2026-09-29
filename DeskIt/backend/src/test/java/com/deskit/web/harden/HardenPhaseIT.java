package com.deskit.web.harden;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.deskit.service.SeatAssignmentService;
import com.deskit.support.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@AutoConfigureMockMvc
class HardenPhaseIT extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private SeatAssignmentService seatAssignmentService;

    @Test
    void assignIdempotencyReplaysSameAssignment() throws Exception {
        String hr = login("{\"role\":\"HR\"}");
        String body = """
                {"deskCode":"T-501","empId":"EMP-1304","assignmentType":"permanent"}
                """;

        MvcResult first = mockMvc.perform(post("/api/v1/floors/floor-hyd-1/assignments")
                        .header("Authorization", "Bearer " + hr)
                        .header("Idempotency-Key", "assign-t501-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.deskCode").value("T-501"))
                .andReturn();

        String assignmentId = objectMapper.readTree(first.getResponse().getContentAsString())
                .get("assignmentId").asText();

        mockMvc.perform(post("/api/v1/floors/floor-hyd-1/assignments")
                        .header("Authorization", "Bearer " + hr)
                        .header("Idempotency-Key", "assign-t501-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.assignmentId").value(assignmentId));

        mockMvc.perform(post("/api/v1/floors/floor-hyd-1/assignments")
                        .header("Authorization", "Bearer " + hr)
                        .header("Idempotency-Key", "assign-t501-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"deskCode":"T-502","empId":"EMP-1304","assignmentType":"permanent"}
                                """))
                .andExpect(status().isConflict());
    }

    @Test
    void temporaryAssignmentExpiresAndDropsFromActiveList() throws Exception {
        String hr = login("{\"role\":\"HR\"}");
        Instant end = Instant.now().minus(1, ChronoUnit.MINUTES);

        mockMvc.perform(post("/api/v1/floors/floor-kol-1/assignments")
                        .header("Authorization", "Bearer " + hr)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "deskCode":"T-601",
                                  "empId":"EMP-1401",
                                  "assignmentType":"temporary",
                                  "temporary":true,
                                  "endDate":"%s"
                                }
                                """.formatted(end.toString())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("active"));

        mockMvc.perform(get("/api/v1/floors/floor-kol-1/assignments")
                        .header("Authorization", "Bearer " + hr))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.deskCode=='T-601')]").exists());

        int expired = seatAssignmentService.expireDueTemporaryAssignments();
        assertThat(expired).isGreaterThanOrEqualTo(1);

        mockMvc.perform(get("/api/v1/floors/floor-kol-1/assignments")
                        .header("Authorization", "Bearer " + hr))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.deskCode=='T-601')]").doesNotExist());

        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM seat_assignments WHERE desk_code = 'T-601' AND status = 'expired'",
                Integer.class
        );
        assertThat(count).isEqualTo(1);
    }

    @Test
    void publishSvgSyncsEntitiesToPostgis() throws Exception {
        String admin = login("{\"role\":\"ADMIN\"}");
        String document = """
                {
                  "version": 2,
                  "name": "PostGIS Sync Floor",
                  "a": 1,
                  "floor": { "cols": 12, "rows": 12, "a": 1 },
                  "entities": [
                    {
                      "objectId": "desk-pg-1",
                      "category": "workstation",
                      "elementType": "computer",
                      "origin": { "col": 4, "row": 8 },
                      "widthCells": 16,
                      "heightCells": 8
                    }
                  ],
                  "zones": [
                    {
                      "id": "zone-pg-1",
                      "label": "Eng",
                      "color": "#00ff00",
                      "origin": { "col": 0, "row": 0 },
                      "widthCells": 32,
                      "heightCells": 32
                    }
                  ],
                  "customLibrary": [],
                  "unusableRegions": []
                }
                """;

        mockMvc.perform(put("/api/v1/floors/floor-5/document/draft")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(document))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/floors/floor-5/publish")
                        .header("Authorization", "Bearer " + admin)
                        .header("Idempotency-Key", "publish-floor-5-svg-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"target\":\"svg\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.channel").value("published"));

        // Replay publish — same release, no duplicate entities
        mockMvc.perform(post("/api/v1/floors/floor-5/publish")
                        .header("Authorization", "Bearer " + admin)
                        .header("Idempotency-Key", "publish-floor-5-svg-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"target\":\"svg\"}"))
                .andExpect(status().isOk());

        Integer entities = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM floor_map_entities e
                JOIN floor_maps m ON m.floor_map_id = e.floor_map_id
                WHERE m.floor_id = 'floor-5' AND m.channel = 'published' AND e.object_id = 'desk-pg-1'
                """,
                Integer.class
        );
        Integer zones = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM floor_map_zones z
                JOIN floor_maps m ON m.floor_map_id = z.floor_map_id
                WHERE m.floor_id = 'floor-5' AND m.channel = 'published' AND z.zone_id = 'zone-pg-1'
                """,
                Integer.class
        );
        assertThat(entities).isEqualTo(1);
        assertThat(zones).isEqualTo(1);

        Boolean validGeom = jdbcTemplate.queryForObject(
                """
                SELECT ST_IsValid(e.outline) FROM floor_map_entities e
                JOIN floor_maps m ON m.floor_map_id = e.floor_map_id
                WHERE m.floor_id = 'floor-5' AND e.object_id = 'desk-pg-1'
                """,
                Boolean.class
        );
        assertThat(validGeom).isTrue();
    }

    private String login(String body) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/dev-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("accessToken").asText();
    }
}
