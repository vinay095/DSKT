package com.deskit.service;

import com.deskit.config.RedisConfig;
import com.deskit.domain.Employee;
import com.deskit.repository.EmployeeRepository;
import com.deskit.repository.EmployeeSpecs;
import com.deskit.web.common.PageResponse;
import com.deskit.web.employee.dto.EmployeeResponse;
import java.util.UUID;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    public EmployeeService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    @Transactional(readOnly = true)
    @Cacheable(
            cacheNames = RedisConfig.CACHE_EMPLOYEES,
            key = "'search:' + (#q ?: '') + ':' + (#team ?: '') + ':' + (#department ?: '') + ':' + (#status ?: '') + ':' + (#location ?: '') + ':' + (#orgId ?: '') + ':' + #page + ':' + #size"
    )
    public PageResponse<EmployeeResponse> search(
            String q,
            String team,
            String department,
            String status,
            String location,
            UUID orgId,
            int page,
            int size
    ) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "name"));
        Page<EmployeeResponse> result = employeeRepository
                .findAll(EmployeeSpecs.search(q, team, department, status, location, orgId), pageable)
                .map(EmployeeResponse::from);
        return PageResponse.from(result);
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = RedisConfig.CACHE_EMPLOYEES, key = "#empId")
    public EmployeeResponse getById(String empId) {
        Employee employee = employeeRepository.findByEmpIdAndActiveTrue(empId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found: " + empId));
        return EmployeeResponse.from(employee);
    }
}
