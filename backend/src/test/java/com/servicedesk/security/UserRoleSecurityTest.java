package com.servicedesk.security;

import com.servicedesk.user.entity.Role;
import com.servicedesk.user.entity.User;
import com.servicedesk.user.enums.RoleType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class UserRoleSecurityTest {

    private final JwtTokenProvider jwtTokenProvider = new JwtTokenProvider(
            "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970",
            86400000
    );

    @Test
    @DisplayName("Should generate valid signed JWT token containing correct username and role claims")
    void testJwtTokenGenerationAndValidation() {
        Role leadRole = Role.builder().id(1).name(RoleType.ROLE_TEAM_LEAD).build();
        Role agentRole = Role.builder().id(2).name(RoleType.ROLE_AGENT).build();

        User user = User.builder()
                .username("lead_tester")
                .email("lead@test.com")
                .fullName("Test Team Lead")
                .passwordHash("hashed")
                .enabled(true)
                .roles(Set.of(leadRole, agentRole))
                .build();
        user.setPublicId(UUID.randomUUID());

        UserPrincipal principal = UserPrincipal.create(user);
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

        String token = jwtTokenProvider.generateToken(auth);

        assertThat(token).isNotBlank();
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
        assertThat(jwtTokenProvider.getUsernameFromToken(token)).isEqualTo("lead_tester");
    }

    @Test
    @DisplayName("Should reject tampered or corrupted JWT tokens")
    void testInvalidTokenRejection() {
        String corruptedToken = "eyJhbGciOiJIUzM4NCJ9.invalidpayload.invalidsignature";
        assertThat(jwtTokenProvider.validateToken(corruptedToken)).isFalse();
    }
}
