package com.deskit.repository;

import com.deskit.domain.AppUser;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {

    Optional<AppUser> findByEmailIgnoreCase(String email);

    Optional<AppUser> findByIdpIssuerAndIdpSubject(String idpIssuer, String idpSubject);

    @Query("select u from AppUser u left join fetch u.roles where u.id = :id")
    Optional<AppUser> findByIdWithRoles(@Param("id") UUID id);

    @Query("select u from AppUser u left join fetch u.roles where lower(u.email) = lower(:email)")
    Optional<AppUser> findByEmailIgnoreCaseWithRoles(@Param("email") String email);
}
