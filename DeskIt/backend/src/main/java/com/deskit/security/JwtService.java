package com.deskit.security;

import com.deskit.config.DeskItProperties;
import com.deskit.domain.AppRole;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.text.ParseException;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final DeskItProperties properties;
    private final byte[] secret;

    public JwtService(DeskItProperties properties) {
        this.properties = properties;
        this.secret = properties.getSecurity().getJwt().getSecret().getBytes(java.nio.charset.StandardCharsets.UTF_8);
        if (secret.length < 32) {
            throw new IllegalStateException("deskit.security.jwt.secret must be at least 32 bytes");
        }
    }

    public String createAccessToken(DeskItPrincipal principal) {
        Instant now = Instant.now();
        Instant expires = now.plus(properties.getSecurity().getJwt().getAccessTokenTtl());

        List<String> roles = principal.getRoles().stream().map(Enum::name).sorted().toList();

        JWTClaimsSet.Builder claims = new JWTClaimsSet.Builder()
                .issuer(properties.getSecurity().getJwt().getIssuer())
                .subject(principal.getUserId().toString())
                .issueTime(Date.from(now))
                .expirationTime(Date.from(expires))
                .jwtID(UUID.randomUUID().toString())
                .claim("email", principal.getEmail())
                .claim("name", principal.getDisplayName())
                .claim("roles", roles);

        if (principal.getEmpId() != null) {
            claims.claim("empId", principal.getEmpId());
        }
        if (principal.getOrgId() != null) {
            claims.claim("orgId", principal.getOrgId().toString());
        }

        try {
            SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims.build());
            jwt.sign(new MACSigner(secret));
            return jwt.serialize();
        } catch (JOSEException ex) {
            throw new IllegalStateException("Failed to sign access token", ex);
        }
    }

    public DeskItPrincipal parsePrincipal(String token) {
        try {
            SignedJWT jwt = SignedJWT.parse(token);
            if (!jwt.verify(new MACVerifier(secret))) {
                throw new IllegalArgumentException("Invalid token signature");
            }

            JWTClaimsSet claims = jwt.getJWTClaimsSet();
            Date expiration = claims.getExpirationTime();
            if (expiration == null || expiration.toInstant().isBefore(Instant.now())) {
                throw new IllegalArgumentException("Token expired");
            }

            if (!properties.getSecurity().getJwt().getIssuer().equals(claims.getIssuer())) {
                throw new IllegalArgumentException("Invalid token issuer");
            }

            @SuppressWarnings("unchecked")
            List<String> roleNames = (List<String>) claims.getClaim("roles");
            Set<AppRole> roles = roleNames == null
                    ? Set.of()
                    : roleNames.stream().map(AppRole::valueOf).collect(Collectors.toSet());

            String orgIdClaim = claims.getStringClaim("orgId");
            UUID orgId = orgIdClaim == null || orgIdClaim.isBlank() ? null : UUID.fromString(orgIdClaim);

            return new DeskItPrincipal(
                    UUID.fromString(claims.getSubject()),
                    claims.getStringClaim("email"),
                    claims.getStringClaim("name"),
                    claims.getStringClaim("empId"),
                    orgId,
                    roles
            );
        } catch (ParseException | JOSEException ex) {
            throw new IllegalArgumentException("Invalid access token", ex);
        }
    }

    public byte[] getSecret() {
        return secret;
    }
}
