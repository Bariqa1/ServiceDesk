package com.servicedesk.ticket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.servicedesk.ServiceDeskApplication;
import com.servicedesk.ticket.dto.TicketCreateRequest;
import com.servicedesk.ticket.entity.Category;
import com.servicedesk.ticket.enums.TicketPriority;
import com.servicedesk.ticket.repository.CategoryRepository;
import com.servicedesk.user.dto.LoginRequest;
import com.servicedesk.user.dto.LoginResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = ServiceDeskApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TicketControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CategoryRepository categoryRepository;

    private String employeeToken;
    private String leadToken;

    @BeforeEach
    void setUp() throws Exception {
        // Authenticate Employee
        MvcResult empResult = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(LoginRequest.builder().username("employee").password("Emp@2026").build())))
                .andExpect(status().isOk())
                .andReturn();
        LoginResponse empResp = objectMapper.readValue(empResult.getResponse().getContentAsString(), LoginResponse.class);
        employeeToken = "Bearer " + empResp.getToken();

        // Authenticate Team Lead
        MvcResult leadResult = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(LoginRequest.builder().username("lead").password("Lead@2026").build())))
                .andExpect(status().isOk())
                .andReturn();
        LoginResponse leadResp = objectMapper.readValue(leadResult.getResponse().getContentAsString(), LoginResponse.class);
        leadToken = "Bearer " + leadResp.getToken();
    }

    @Test
    @DisplayName("Should successfully authenticate employee and create a new support ticket with SLA deadlines")
    void testCreateTicketIntegration() throws Exception {
        Category netCat = categoryRepository.findByCode("NET").orElseThrow();

        TicketCreateRequest request = TicketCreateRequest.builder()
                .title("Wi-Fi signal dropping in Building C")
                .description("Continuous disconnection when roaming between access points on 3rd floor.")
                .priority(TicketPriority.HIGH)
                .categoryPublicId(netCat.getPublicId())
                .build();

        mockMvc.perform(post("/api/v1/tickets")
                .header("Authorization", employeeToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ticketNumber").isNotEmpty())
                .andExpect(jsonPath("$.title").value("Wi-Fi signal dropping in Building C"))
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.priority").value("HIGH"))
                .andExpect(jsonPath("$.responseDeadline").isNotEmpty())
                .andExpect(jsonPath("$.resolutionDeadline").isNotEmpty());
    }

    @Test
    @DisplayName("Should fetch paginated tickets list and dashboard metrics")
    void testGetTicketsAndDashboardMetrics() throws Exception {
        mockMvc.perform(get("/api/v1/tickets")
                .header("Authorization", leadToken)
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").isNotEmpty());

        mockMvc.perform(get("/api/v1/dashboard")
                .header("Authorization", leadToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalTickets").isNotEmpty())
                .andExpect(jsonPath("$.openTickets").isNotEmpty())
                .andExpect(jsonPath("$.slaComplianceRate").isNumber());
    }
}
