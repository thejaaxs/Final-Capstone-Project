package com.example.demo.service;

import com.example.demo.entity.Vehicle;
import com.example.demo.repository.VehicleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class VehicleService {

    private final VehicleRepository repository;
    private final FileStorageService fileStorageService;

    public VehicleService(VehicleRepository repository, FileStorageService fileStorageService) {
        this.repository = repository;
        this.fileStorageService = fileStorageService;
    }

    // ============================
    // ADD VEHICLE
    // ============================
    public Vehicle addVehicle(Vehicle vehicle) {
        return repository.save(vehicle);
    }

    // ============================
    // GET ALL VEHICLES
    // ============================
    public List<Vehicle> getAllVehicles() {
        List<Vehicle> vehicles = repository.findAll();
        // Dynamically set full URL for response
        vehicles.forEach(v -> v.setImageUrl(fileStorageService.getFileUrl(v.getImageUrl())));
        return vehicles;
    }

    // ============================
    // GET VEHICLE BY ID
    // ============================
    public Vehicle getVehicleById(Long id) {
        Vehicle vehicle = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found"));
        vehicle.setImageUrl(fileStorageService.getFileUrl(vehicle.getImageUrl()));
        return vehicle;
    }

    // ============================
    // GET VEHICLES BY DEALER
    // ============================
    public List<Vehicle> getByDealer(Long dealerId) {
        List<Vehicle> vehicles = repository.findByDealerId(dealerId);
        vehicles.forEach(v -> v.setImageUrl(fileStorageService.getFileUrl(v.getImageUrl())));
        return vehicles;
    }

    // ============================
    // UPDATE VEHICLE
    // ============================
    public Vehicle updateVehicle(Long id, Vehicle vehicle) {
        Vehicle existing = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found"));

        existing.setName(vehicle.getName());
        existing.setBrand(vehicle.getBrand());
        existing.setPrice(vehicle.getPrice());
        existing.setStatus(vehicle.getStatus());
        existing.setMileage(vehicle.getMileage());
        existing.setRideType(vehicle.getRideType());
        existing.setSuitableDailyKm(vehicle.getSuitableDailyKm());
        existing.setDealerId(vehicle.getDealerId());

        return repository.save(existing);
    }

    // ============================
    // UPLOAD IMAGE
    // ============================
    public Vehicle uploadImage(Long id, MultipartFile file) {
        Vehicle vehicle = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found"));

        // Delete old image if exists
        if (vehicle.getImageUrl() != null) {
            fileStorageService.deleteFile(vehicle.getImageUrl());
        }

        String fileName = fileStorageService.saveFile(file);
        vehicle.setImageUrl(fileName); // store only filename in DB

        return repository.save(vehicle);
    }

    // ============================
    // DELETE VEHICLE (also deletes image)
    // ============================
    public void deleteVehicle(Long id) {
        Vehicle vehicle = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found"));

        if (vehicle.getImageUrl() != null) {
            fileStorageService.deleteFile(vehicle.getImageUrl());
        }

        repository.deleteById(id);
    }

    // ============================
    // DELETE IMAGE ONLY
    // ============================
    public Vehicle deleteImage(Long id) {
        Vehicle vehicle = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found"));

        if (vehicle.getImageUrl() != null) {
            fileStorageService.deleteFile(vehicle.getImageUrl());
        }

        vehicle.setImageUrl(null);
        return repository.save(vehicle);
    }
}