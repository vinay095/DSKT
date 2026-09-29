package com.deskit.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "app_users")
@EntityListeners(AuditingEntityListener.class)
public class AppUser {

    @Id
    private UUID id;

    @Column(name = "emp_id", length = 64)
    private String empId;

    @Column(nullable = false, unique = true, length = 320)
    private String email;

    @Column(name = "idp_subject", length = 512)
    private String idpSubject;

    @Column(name = "idp_issuer", length = 512)
    private String idpIssuer;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private Set<UserRoleEntity> roles = new HashSet<>();

    protected AppUser() {
    }

    public static AppUser create(String email, String displayName, String empId, String idpSubject, String idpIssuer) {
        AppUser user = new AppUser();
        user.id = UUID.randomUUID();
        user.email = email.toLowerCase();
        user.displayName = displayName;
        user.empId = empId;
        user.idpSubject = idpSubject;
        user.idpIssuer = idpIssuer;
        return user;
    }

    public void addRole(AppRole role) {
        boolean exists = roles.stream().anyMatch(r -> r.getRole() == role);
        if (!exists) {
            roles.add(UserRoleEntity.of(this, role));
        }
    }

    public void touchLogin() {
        this.lastLoginAt = Instant.now();
    }

    public void linkIdentity(String idpSubject, String idpIssuer) {
        this.idpSubject = idpSubject;
        this.idpIssuer = idpIssuer;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public void setEmpId(String empId) {
        this.empId = empId;
    }

    public UUID getId() {
        return id;
    }

    public String getEmpId() {
        return empId;
    }

    public String getEmail() {
        return email;
    }

    public String getIdpSubject() {
        return idpSubject;
    }

    public String getIdpIssuer() {
        return idpIssuer;
    }

    public String getDisplayName() {
        return displayName;
    }

    public Instant getLastLoginAt() {
        return lastLoginAt;
    }

    public Set<UserRoleEntity> getRoles() {
        return roles;
    }

    public Set<AppRole> roleSet() {
        Set<AppRole> result = new HashSet<>();
        for (UserRoleEntity role : roles) {
            result.add(role.getRole());
        }
        return result;
    }
}
