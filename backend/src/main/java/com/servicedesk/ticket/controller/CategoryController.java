package com.servicedesk.ticket.controller;

import com.servicedesk.ticket.dto.CategoryResponseDTO;
import com.servicedesk.ticket.dto.ServiceResponseDTO;
import com.servicedesk.ticket.service.TicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
@Tag(name = "Categories & Services", description = "Service Catalog taxonomy and categorization")
public class CategoryController {

    private final TicketService ticketService;

    @GetMapping
    @Operation(summary = "List all ticket categories")
    public ResponseEntity<List<CategoryResponseDTO>> getCategories() {
        return ResponseEntity.ok(ticketService.getCategories());
    }

    @GetMapping("/{categoryPublicId}/services")
    @Operation(summary = "List all services under a specific category")
    public ResponseEntity<List<ServiceResponseDTO>> getServicesByCategory(@PathVariable UUID categoryPublicId) {
        return ResponseEntity.ok(ticketService.getServicesByCategory(categoryPublicId));
    }
}
