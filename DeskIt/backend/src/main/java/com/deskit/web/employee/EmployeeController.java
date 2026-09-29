package com.deskit.web.employee;

import com.deskit.domain.AppRole;
import com.deskit.security.DeskItPrincipal;
import com.deskit.service.EmployeeService;
import com.deskit.web.common.PageResponse;
import com.deskit.web.employee.dto.EmployeeResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/employees")
@Tag(name = "Employees")
@SecurityRequirement(name = "bearer-jwt")
public class EmployeeController {

    private static final int EMPLOYEE_MAX_PAGE_SIZE = 20;
    private static final int HR_MAX_PAGE_SIZE = 100;

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Search / list employees (HR full directory; employees need q)")
    public PageResponse<EmployeeResponse> search(
            @AuthenticationPrincipal DeskItPrincipal principal,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String team,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String location,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        boolean directoryAccess = principal.hasRole(AppRole.HR) || principal.hasRole(AppRole.ADMIN);
        if (!directoryAccess) {
            if (q == null || q.trim().length() < 2) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Employees must provide search query q (min 2 characters)"
                );
            }
            size = Math.min(size, EMPLOYEE_MAX_PAGE_SIZE);
        } else {
            size = Math.min(Math.max(size, 1), HR_MAX_PAGE_SIZE);
        }
        page = Math.max(page, 0);

        return employeeService.search(
                q,
                team,
                department,
                status,
                location,
                principal.getOrgId(),
                page,
                size
        );
    }

    @GetMapping("/{empId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get employee by emp id")
    public EmployeeResponse get(@PathVariable String empId) {
        return employeeService.getById(empId);
    }
}
