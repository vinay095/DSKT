package com.deskit.web.employee;

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
class EmployeeControllerIT extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void employeeNeedsQueryForSearch() throws Exception {
        String token = login("{\"role\":\"EMPLOYEE\"}");

        mockMvc.perform(get("/api/v1/employees").header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/v1/employees")
                        .param("q", "Alex")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].empId").value("EMP-1304"));
    }

    @Test
    void hrCanBrowseDirectoryAndFilter() throws Exception {
        String token = login("{\"role\":\"HR\"}");

        mockMvc.perform(get("/api/v1/employees")
                        .param("department", "Engineering")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(org.hamcrest.Matchers.greaterThanOrEqualTo(2)));

        mockMvc.perform(get("/api/v1/employees")
                        .param("location", "Hyderabad")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].empId").value("EMP-1403"));
    }

    @Test
    void getEmployeeById() throws Exception {
        String token = login("{\"role\":\"EMPLOYEE\"}");

        mockMvc.perform(get("/api/v1/employees/EMP-1305").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("sarah.jenkins@deskit.io"))
                .andExpect(jsonPath("$.department").value("People & Culture"));
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
