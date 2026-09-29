package com.deskit.security;

import com.deskit.domain.AppRole;
import java.util.Collection;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public class DeskItPrincipal implements UserDetails {

    private final UUID userId;
    private final String email;
    private final String displayName;
    private final String empId;
    private final UUID orgId;
    private final Set<AppRole> roles;
    private final Collection<? extends GrantedAuthority> authorities;

    public DeskItPrincipal(
            UUID userId,
            String email,
            String displayName,
            String empId,
            UUID orgId,
            Set<AppRole> roles
    ) {
        this.userId = userId;
        this.email = email;
        this.displayName = displayName;
        this.empId = empId;
        this.orgId = orgId;
        this.roles = Set.copyOf(roles);
        this.authorities = this.roles.stream()
                .map(role -> new SimpleGrantedAuthority(role.asAuthority()))
                .collect(Collectors.toSet());
    }

    public UUID getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getEmpId() {
        return empId;
    }

    public UUID getOrgId() {
        return orgId;
    }

    public Set<AppRole> getRoles() {
        return roles;
    }

    public boolean hasRole(AppRole role) {
        return roles.contains(role);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return "";
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
