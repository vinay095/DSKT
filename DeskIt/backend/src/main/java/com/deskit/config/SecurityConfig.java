package com.deskit.config;

import com.deskit.security.DeskItJwtAuthenticationConverter;
import com.deskit.security.OidcLoginSuccessHandler;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final DeskItProperties properties;
    private final ObjectProvider<OidcLoginSuccessHandler> oidcLoginSuccessHandler;
    private final ObjectProvider<ClientRegistrationRepository> clientRegistrationRepository;
    private final DeskItJwtAuthenticationConverter deskItJwtAuthenticationConverter;

    public SecurityConfig(
            DeskItProperties properties,
            ObjectProvider<OidcLoginSuccessHandler> oidcLoginSuccessHandler,
            ObjectProvider<ClientRegistrationRepository> clientRegistrationRepository,
            DeskItJwtAuthenticationConverter deskItJwtAuthenticationConverter
    ) {
        this.properties = properties;
        this.oidcLoginSuccessHandler = oidcLoginSuccessHandler;
        this.clientRegistrationRepository = clientRegistrationRepository;
        this.deskItJwtAuthenticationConverter = deskItJwtAuthenticationConverter;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        List<String> permitAll = new ArrayList<>(List.of(
                "/actuator/health",
                "/actuator/health/**",
                "/actuator/info",
                "/api/v1/health",
                "/api/v1/health/**",
                "/api/v1/auth/login/**",
                "/api/v1/auth/providers",
                "/api/v1/auth/refresh",
                "/api/v1/auth/logout",
                "/oauth2/**",
                "/login/oauth2/**"
        ));

        if (properties.getSecurity().isDevLoginEnabled()) {
            permitAll.add("/api/v1/auth/dev-login");
        }
        if (properties.getOps().isOpenApiPublic()) {
            permitAll.add("/v3/api-docs");
            permitAll.add("/v3/api-docs/**");
            permitAll.add("/swagger-ui.html");
            permitAll.add("/swagger-ui/**");
        }
        if (properties.getOps().isPrometheusPublic()) {
            permitAll.add("/actuator/prometheus");
        }

        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .headers(headers -> headers
                        .contentTypeOptions(Customizer.withDefaults())
                        .frameOptions(frame -> frame.deny())
                        .xssProtection(Customizer.withDefaults())
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(permitAll.toArray(String[]::new))
                        .permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**")
                        .permitAll()
                        .requestMatchers("/actuator/**")
                        .hasRole("ADMIN")
                        .anyRequest()
                        .authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt ->
                        jwt.jwtAuthenticationConverter(deskItJwtAuthenticationConverter)
                ));

        if (clientRegistrationRepository.getIfAvailable() != null
                && oidcLoginSuccessHandler.getIfAvailable() != null) {
            OidcLoginSuccessHandler successHandler = oidcLoginSuccessHandler.getObject();
            http.oauth2Login(oauth -> oauth.successHandler(successHandler));
        }

        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(properties.getCors().allowedOriginList());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "X-Request-Id",
                "Idempotency-Key",
                "X-Forwarded-For"
        ));
        configuration.setExposedHeaders(List.of(
                "X-Request-Id",
                "X-RateLimit-Limit",
                "X-RateLimit-Remaining",
                "Retry-After"
        ));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
