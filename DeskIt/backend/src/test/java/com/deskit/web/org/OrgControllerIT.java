package com.deskit.web.org;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@AutoConfigureMockMvc
class OrgControllerIT extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void officesRequireAuth() throws Exception {
        mockMvc.perform(get("/api/v1/offices"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void listOfficesAndFloors() throws Exception {
        String token = login("{\"role\":\"EMPLOYEE\"}");

        mockMvc.perform(get("/api/v1/offices").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id=='office-noida')]").exists());

        mockMvc.perform(get("/api/v1/floors").param("officeId", "office-noida")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id=='floor-4')]").exists());

        mockMvc.perform(get("/api/v1/floors/floor-4").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.locationLabel").value("Noida 4th Floor"));
    }

    @Test
    void adminCanCreateCloneAndDeleteCustomFloor() throws Exception {
        String admin = login("{\"role\":\"ADMIN\"}");
        String employee = login("{\"role\":\"EMPLOYEE\"}");

        mockMvc.perform(post("/api/v1/floors")
                        .header("Authorization", "Bearer " + employee)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "officeId":"office-noida",
                                  "label":"Temp Floor",
                                  "shortLabel":"Temp",
                                  "locationLabel":"Noida Temp"
                                }
                                """))
                .andExpect(status().isForbidden());

        MvcResult created = mockMvc.perform(post("/api/v1/floors")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "officeId":"office-noida",
                                  "label":"Temp Floor",
                                  "shortLabel":"Temp",
                                  "locationLabel":"Noida Temp"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.custom").value(true))
                .andReturn();

        String floorId = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asText();

        MvcResult cloned = mockMvc.perform(post("/api/v1/floors/" + floorId + "/clone")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "label":"Temp Floor Clone",
                                  "shortLabel":"Temp Clone"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.clonedFromId").value(floorId))
                .andReturn();

        String cloneId = objectMapper.readTree(cloned.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(delete("/api/v1/floors/" + cloneId).header("Authorization", "Bearer " + admin))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/floors/" + cloneId).header("Authorization", "Bearer " + admin))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/v1/floors/floor-4").header("Authorization", "Bearer " + admin))
                .andExpect(status().isBadRequest());
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
