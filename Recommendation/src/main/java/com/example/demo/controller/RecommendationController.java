package com.example.demo.controller;

import com.example.demo.dto.RecommendationRequest;
import com.example.demo.dto.VehicleDto;
import com.example.demo.service.RecommendationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/recommend")
public class RecommendationController {

    private final RecommendationService service;

    public RecommendationController(RecommendationService service) {
        this.service = service;
    }

    @GetMapping("/test-all")
    public List<VehicleDto> testAllVehicles() {
        return service.getAllVehiclesFromVehicleService();
    }

    @PostMapping
    public List<VehicleDto> recommend(@RequestBody RecommendationRequest request) {

        if (request == null || request.getSession() == null) {
            throw new RuntimeException("Session data is required");
        }

        return service.recommendFromUser(
                request.getSession().getBudget(),
                request.getSession().getDailyKm(),
                request.getSession().getRideType(),
                request.getSession().getMileage()
        );
    }
}