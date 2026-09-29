package com.deskit.repository;

import com.deskit.domain.Employee;
import jakarta.persistence.criteria.Expression;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;

public final class EmployeeSpecs {

    private EmployeeSpecs() {
    }

    public static Specification<Employee> search(
            String q,
            String team,
            String department,
            String status,
            String location,
            UUID orgId
    ) {
        return (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isTrue(root.get("active")));

            if (orgId != null) {
                predicates.add(cb.equal(root.get("orgId"), orgId));
            }
            if (q != null && !q.isBlank()) {
                String pattern = "%" + q.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), pattern),
                        cb.like(cb.lower(root.get("email")), pattern),
                        cb.like(cb.lower(root.get("team")), pattern),
                        cb.like(cb.lower(root.get("department")), pattern)
                ));
            }
            if (team != null && !team.isBlank()) {
                predicates.add(cb.equal(root.get("team"), team.trim()));
            }
            if (department != null && !department.isBlank()) {
                predicates.add(cb.equal(root.get("department"), department.trim()));
            }
            if (status != null && !status.isBlank()) {
                predicates.add(cb.equal(root.get("status"), status.trim()));
            }
            if (location != null && !location.isBlank()) {
                Expression<String> joined = cb.function(
                        "array_to_string",
                        String.class,
                        root.get("locations"),
                        cb.literal(",")
                );
                predicates.add(cb.like(cb.lower(joined), "%" + location.trim().toLowerCase() + "%"));
            }

            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }
}
