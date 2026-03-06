package com.dealer.controller;

import com.dealer.dto.*;
import com.dealer.service.DealerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/dealers")
@RequiredArgsConstructor
public class DealerController {

    private final DealerService service;

    @PostMapping("/add")
    public ResponseEntity<DealerResponseDTO> addDealer(
            @Valid @RequestBody DealerRequestDTO dto) {

        return ResponseEntity.ok(service.addDealer(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DealerResponseDTO> updateDealer(
            @PathVariable Long id,
            @Valid @RequestBody DealerRequestDTO dto) {

        return ResponseEntity.ok(service.updateDealer(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteDealer(@PathVariable Long id) {
        service.deleteDealer(id);
        return ResponseEntity.ok("Dealer deleted successfully");
    }

    @GetMapping("/{id}")
    public ResponseEntity<DealerResponseDTO> getDealer(@PathVariable Long id) {
        return ResponseEntity.ok(service.getDealerById(id));
    }

    @GetMapping("/list")
    public ResponseEntity<List<DealerResponseDTO>> getAllDealers() {
        return ResponseEntity.ok(service.getAllDealers());
    }
}
