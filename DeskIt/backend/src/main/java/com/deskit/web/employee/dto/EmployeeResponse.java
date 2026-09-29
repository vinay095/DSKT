package com.deskit.web.employee.dto;

import com.deskit.domain.Employee;
import com.fasterxml.jackson.annotation.JsonGetter;
import java.util.List;
import java.util.UUID;

/**
 * CamelCase API fields plus snake_case / legacy aliases ({@code emp_id}, {@code manager})
 * matching frontend {@code DbEmployee}.
 */
public record EmployeeResponse(
        String empId,
        UUID orgId,
        String name,
        String email,
        String team,
        String managerEmpId,
        String department,
        List<String> locations,
        String status,
        String avatar,
        String title
) {
    public static EmployeeResponse from(Employee employee) {
        String[] locations = employee.getLocations() == null ? new String[0] : employee.getLocations();
        return new EmployeeResponse(
                employee.getEmpId(),
                employee.getOrgId(),
                employee.getName(),
                employee.getEmail(),
                employee.getTeam(),
                employee.getManagerEmpId(),
                employee.getDepartment(),
                List.of(locations),
                employee.getStatus(),
                employee.getAvatar(),
                employee.getTitle()
        );
    }

    @JsonGetter("emp_id")
    public String empIdSnake() {
        return empId;
    }

    /** Legacy DbEmployee field name for manager emp id. */
    @JsonGetter("manager")
    public String manager() {
        return managerEmpId;
    }
}
