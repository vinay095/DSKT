package com.deskit.security;

import com.deskit.domain.AppRole;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;

/**
 * Not registered as a Spring {@link Converter} bean (that would break MVC ConversionService).
 */
public class DeskItJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final JwtAuthenticationConverter delegate;

    public DeskItJwtAuthenticationConverter(JwtAuthenticationConverter delegate) {
        this.delegate = delegate;
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        AbstractAuthenticationToken base = delegate.convert(jwt);
        DeskItPrincipal principal = toPrincipal(jwt, base.getAuthorities());
        return new UsernamePasswordAuthenticationToken(
                principal,
                jwt.getTokenValue(),
                principal.getAuthorities()
        );
    }

    private static DeskItPrincipal toPrincipal(Jwt jwt, Collection<? extends GrantedAuthority> authorities) {
        Set<AppRole> roles = new HashSet<>();
        Object rolesClaim = jwt.getClaim("roles");
        if (rolesClaim instanceof Collection<?> collection) {
            for (Object role : collection) {
                roles.add(AppRole.valueOf(role.toString()));
            }
        } else {
            for (GrantedAuthority authority : authorities) {
                roles.add(AppRole.fromAuthority(authority.getAuthority()));
            }
        }

        String orgId = jwt.getClaimAsString("orgId");
        return new DeskItPrincipal(
                UUID.fromString(jwt.getSubject()),
                jwt.getClaimAsString("email"),
                jwt.getClaimAsString("name"),
                jwt.getClaimAsString("empId"),
                orgId == null || orgId.isBlank() ? null : UUID.fromString(orgId),
                roles
        );
    }
}
