package com.deskit.service;

import com.deskit.config.DeskItProperties;
import com.deskit.domain.AppRole;
import com.deskit.domain.AppUser;
import com.deskit.domain.Employee;
import com.deskit.repository.AppUserRepository;
import com.deskit.repository.EmployeeRepository;
import com.deskit.security.DeskItPrincipal;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserProvisioningService {

    private final AppUserRepository appUserRepository;
    private final EmployeeRepository employeeRepository;
    private final DeskItProperties properties;

    public UserProvisioningService(
            AppUserRepository appUserRepository,
            EmployeeRepository employeeRepository,
            DeskItProperties properties
    ) {
        this.appUserRepository = appUserRepository;
        this.employeeRepository = employeeRepository;
        this.properties = properties;
    }

    @Transactional
    public DeskItPrincipal provisionOidcUser(
            String provider,
            String subject,
            String issuer,
            String email,
            String displayName,
            Set<String> idpGroups
    ) {
        String normalizedEmail = email.toLowerCase(Locale.ROOT);

        AppUser user = appUserRepository.findByIdpIssuerAndIdpSubject(issuer, subject)
                .or(() -> appUserRepository.findByEmailIgnoreCaseWithRoles(normalizedEmail))
                .orElseGet(() -> AppUser.create(normalizedEmail, displayName, null, subject, issuer));

        user.linkIdentity(subject, issuer);
        if (displayName != null && !displayName.isBlank()) {
            user.setDisplayName(displayName);
        }

        Optional<Employee> employee = employeeRepository.findByEmailIgnoreCase(normalizedEmail);
        employee.ifPresent(emp -> user.setEmpId(emp.getEmpId()));

        if (user.getRoles().isEmpty()) {
            resolveRoles(provider, normalizedEmail, idpGroups).forEach(user::addRole);
        }

        user.touchLogin();
        AppUser saved = appUserRepository.save(user);
        return toPrincipal(saved, employee.orElse(null));
    }

    @Transactional(readOnly = true)
    public DeskItPrincipal loadPrincipal(UUID userId) {
        AppUser user = appUserRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Employee employee = user.getEmpId() == null
                ? null
                : employeeRepository.findById(user.getEmpId()).orElse(null);
        return toPrincipal(user, employee);
    }

    @Transactional
    public DeskItPrincipal loadByEmailForDevLogin(String email) {
        String normalizedEmail = email.toLowerCase(Locale.ROOT);
        AppUser user = appUserRepository.findByEmailIgnoreCaseWithRoles(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("No seeded user for email: " + email));
        user.touchLogin();
        appUserRepository.save(user);
        Employee employee = user.getEmpId() == null
                ? null
                : employeeRepository.findById(user.getEmpId()).orElse(null);
        return toPrincipal(user, employee);
    }

    @Transactional
    public DeskItPrincipal loadByRoleForDevLogin(AppRole role) {
        return appUserRepository.findAll().stream()
                .filter(user -> user.roleSet().contains(role))
                .findFirst()
                .map(user -> {
                    AppUser reloaded = appUserRepository.findByIdWithRoles(user.getId()).orElseThrow();
                    reloaded.touchLogin();
                    appUserRepository.save(reloaded);
                    Employee employee = reloaded.getEmpId() == null
                            ? null
                            : employeeRepository.findById(reloaded.getEmpId()).orElse(null);
                    return toPrincipal(reloaded, employee);
                })
                .orElseThrow(() -> new IllegalArgumentException("No seeded user for role: " + role));
    }

    private Set<AppRole> resolveRoles(String provider, String email, Set<String> idpGroups) {
        Set<AppRole> roles = new HashSet<>();

        if (properties.getSecurity().getAdminEmailAllowlist().stream()
                .anyMatch(allowed -> allowed.equalsIgnoreCase(email))) {
            roles.add(AppRole.ADMIN);
        }

        Map<String, String> providerMap = properties.getSecurity().getRoleMapping().getOrDefault(provider, Map.of());
        for (String group : idpGroups) {
            String mapped = providerMap.get(group);
            if (mapped != null) {
                roles.add(AppRole.valueOf(mapped.toUpperCase(Locale.ROOT)));
            }
        }

        if (roles.isEmpty()) {
            roles.add(AppRole.valueOf(properties.getSecurity().getDefaultRole().toUpperCase(Locale.ROOT)));
        }
        return roles;
    }

    private DeskItPrincipal toPrincipal(AppUser user, Employee employee) {
        UUID orgId = employee != null ? employee.getOrgId() : null;
        return new DeskItPrincipal(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getEmpId(),
                orgId,
                user.roleSet()
        );
    }
}
