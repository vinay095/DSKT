package com.deskit.web.floormap;

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.deskit.support.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@AutoConfigureMockMvc
class FloorMapControllerIT extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void draftRequiresAdminPublishedReadable() throws Exception {
        String employee = login("{\"role\":\"EMPLOYEE\"}");
        String admin = login("{\"role\":\"ADMIN\"}");

        mockMvc.perform(get("/api/v1/floors/floor-4/document")
                        .param("channel", "draft")
                        .header("Authorization", "Bearer " + employee))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/floors/floor-4/document")
                        .param("channel", "draft")
                        .header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.channel").value("draft"))
                .andExpect(jsonPath("$.schemaVersion").value(2));
    }

    @Test
    void saveDraftPublishSvgAndReadPublished() throws Exception {
        String admin = login("{\"role\":\"ADMIN\"}");
        String employee = login("{\"role\":\"EMPLOYEE\"}");

        String document = """
                {
                  "version": 2,
                  "name": "Floor 4 Draft",
                  "a": 1,
                  "floor": { "cols": 12, "rows": 12, "a": 1 },
                  "entities": [
                    {
                      "objectId": "desk-test-1",
                      "category": "workstation",
                      "elementType": "computer",
                      "origin": { "col": 16, "row": 16 },
                      "widthCells": 16,
                      "heightCells": 8
                    }
                  ],
                  "zones": [],
                  "customLibrary": [],
                  "unusableRegions": []
                }
                """;

        mockMvc.perform(put("/api/v1/floors/floor-4/document/draft")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(document))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.document.entities", hasSize(1)));

        mockMvc.perform(post("/api/v1/floors/floor-4/publish")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"target\":\"svg\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.channel").value("published"))
                .andExpect(jsonPath("$.releaseVersion").value(greaterThan(0)))
                .andExpect(jsonPath("$.document.entities[0].objectId").value("desk-test-1"));

        mockMvc.perform(get("/api/v1/floors/floor-4/document")
                        .param("channel", "published")
                        .header("Authorization", "Bearer " + employee))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.document.entities[0].objectId").value("desk-test-1"));
    }

    @Test
    void publishDeskRequiresPlan() throws Exception {
        String admin = login("{\"role\":\"ADMIN\"}");

        mockMvc.perform(post("/api/v1/floors/floor-5/publish")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"target\":\"desk\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(put("/api/v1/floors/floor-5/plan/draft")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "id": "floor-5",
                                  "name": "6th Floor",
                                  "desks": [],
                                  "version": 1
                                }
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/floors/floor-5/publish")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"target\":\"desk\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.planDocument.desks").isArray());
    }

    @Test
    void elementCatalogSeeded() throws Exception {
        String token = login("{\"role\":\"EMPLOYEE\"}");

        mockMvc.perform(get("/api/v1/element-types").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThan(10))))
                .andExpect(jsonPath("$[?(@.elementId=='workstation:computer')]").exists());
    }

    @Test
    void cloneFloorCopiesDraftDocument() throws Exception {
        String admin = login("{\"role\":\"ADMIN\"}");

        mockMvc.perform(put("/api/v1/floors/floor-3/document/draft")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "version": 2,
                                  "name": "Floor 3",
                                  "a": 1,
                                  "floor": { "cols": 10, "rows": 10, "a": 1 },
                                  "entities": [
                                    {
                                      "objectId": "clone-marker",
                                      "category": "plant",
                                      "elementType": "plant",
                                      "origin": { "col": 0, "row": 0 },
                                      "widthCells": 8,
                                      "heightCells": 8
                                    }
                                  ],
                                  "zones": [],
                                  "customLibrary": [],
                                  "unusableRegions": []
                                }
                                """))
                .andExpect(status().isOk());

        MvcResult cloned = mockMvc.perform(post("/api/v1/floors/floor-3/clone")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "label": "Floor 3 Clone",
                                  "shortLabel": "F3 Clone"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        String cloneId = objectMapper.readTree(cloned.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(get("/api/v1/floors/" + cloneId + "/document")
                        .param("channel", "draft")
                        .header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.document.entities[0].objectId").value("clone-marker"));
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
