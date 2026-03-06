package com.example.demo.service;

import com.example.demo.client.VehicleFeignClient;
import com.example.demo.dto.VehicleDto;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
public class RecommendationService {

    private final VehicleFeignClient vehicleFeignClient;

    public RecommendationService(VehicleFeignClient vehicleFeignClient) {
        this.vehicleFeignClient = vehicleFeignClient;
    }

    public List<VehicleDto> getAllVehiclesFromVehicleService() {
        List<VehicleDto> vehicles = vehicleFeignClient.getAllVehicles();

        System.out.println("==== ALL VEHICLES FROM VEHICLE SERVICE ====");
        System.out.println("TOTAL VEHICLES RECEIVED = " + vehicles.size());

        vehicles.forEach(v -> System.out.println(
                "Vehicle: " + v.getName()
                        + " | status=" + v.getStatus()
                        + " | price=" + v.getPrice()
                        + " | rideType=" + v.getRideType()
                        + " | mileage=" + v.getMileage()
                        + " | suitableDailyKm=" + v.getSuitableDailyKm()
        ));

        return vehicles;
    }

    public List<VehicleDto> recommendFromUser(double budget, double dailyKm, String rideType, int mileage) {
        List<VehicleDto> vehicles = vehicleFeignClient.getAllVehicles();

        System.out.println("==== RECOMMENDATION INPUT ====");
        System.out.println("budget = " + budget);
        System.out.println("dailyKm = " + dailyKm);
        System.out.println("rideType = " + rideType);
        System.out.println("mileage = " + mileage);

        System.out.println("==== VEHICLES BEFORE FILTER ====");
        System.out.println("TOTAL VEHICLES RECEIVED = " + vehicles.size());

        vehicles.forEach(v -> System.out.println(
                "Vehicle: " + v.getName()
                        + " | status=" + v.getStatus()
                        + " | price=" + v.getPrice()
                        + " | rideType=" + v.getRideType()
                        + " | mileage=" + v.getMileage()
                        + " | suitableDailyKm=" + v.getSuitableDailyKm()
        ));

        List<VehicleDto> result = vehicles.stream()
                .filter(v -> v.getStatus() != null && v.getStatus().trim().equalsIgnoreCase("AVAILABLE"))
                .filter(v -> v.getPrice() != null && v.getPrice() <= budget)
                .filter(v -> v.getRideType() != null && v.getRideType().trim().equalsIgnoreCase(rideType.trim()))
                .filter(v -> v.getMileage() != null && v.getMileage() >= mileage)
                .filter(v -> v.getSuitableDailyKm() != null && v.getSuitableDailyKm() >= dailyKm)
                .sorted(Comparator.comparingDouble(
                        (VehicleDto v) -> scoreVehicle(v, budget, dailyKm, mileage)
                ).reversed())
                .limit(3)
                .toList();

        System.out.println("==== VEHICLES AFTER FILTER ====");
        System.out.println("MATCHED VEHICLES = " + result.size());

        result.forEach(v -> System.out.println(
                "Matched -> " + v.getName()
                        + " | status=" + v.getStatus()
                        + " | price=" + v.getPrice()
                        + " | rideType=" + v.getRideType()
                        + " | mileage=" + v.getMileage()
                        + " | suitableDailyKm=" + v.getSuitableDailyKm()
                        + " | score=" + scoreVehicle(v, budget, dailyKm, mileage)
        ));

        return result;
    }

    private double scoreVehicle(VehicleDto vehicle, double budget, double dailyKm, int mileage) {
        double score = 0;

        double priceDiff = Math.abs(budget - vehicle.getPrice());
        score += Math.max(0, (budget - priceDiff) / 1000.0);

        if (vehicle.getMileage() >= mileage) {
            score += 20;
        }

        if (vehicle.getSuitableDailyKm() >= dailyKm) {
            score += 15;
        }

        return score;
    }
}