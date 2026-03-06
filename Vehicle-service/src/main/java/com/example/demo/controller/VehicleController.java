package com.example.demo.controller;

import com.example.demo.entity.Vehicle;
import com.example.demo.service.VehicleService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/vehicles")
public class VehicleController {

    private final VehicleService service;

    public VehicleController(VehicleService service) {
        this.service = service;
    }

    // ============================
    // ADD VEHICLE
    // ============================
    @PostMapping
    public Vehicle add(@RequestBody Vehicle vehicle) {
        return service.addVehicle(vehicle);
    }

    // ============================
    // GET ALL VEHICLES
    // ============================
    @GetMapping
    public List<Vehicle> getAll() {
        return service.getAllVehicles();
    }

    // ============================
    // GET VEHICLE BY ID
    // ============================
    @GetMapping("/{id}")
    public Vehicle getById(@PathVariable Long id) {
        return service.getVehicleById(id);
    }

    // ============================
    // GET VEHICLES BY DEALER
    // ============================
    @GetMapping("/dealer/{dealerId}")
    public List<Vehicle> getDealerVehicles(@PathVariable Long dealerId) {
        return service.getByDealer(dealerId);
    }

    // ============================
    // UPDATE VEHICLE
    // ============================
    @PutMapping("/{id}")
    public Vehicle update(@PathVariable Long id,
                          @RequestBody Vehicle vehicle) {
        return service.updateVehicle(id, vehicle);
    }

    // ============================
    // DELETE VEHICLE (also deletes image)
    // ============================
    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        service.deleteVehicle(id);
        return "Deleted Successfully";
    }

    // ============================
    // UPLOAD VEHICLE IMAGE
    // ============================
    @PostMapping("/{id}/upload-image")
    public Vehicle uploadImage(@PathVariable Long id,
                               @RequestParam("file") MultipartFile file) throws IOException {
        return service.uploadImage(id, file);
    }

    // ============================
    // DELETE IMAGE ONLY
    // ============================
    @DeleteMapping("/{id}/delete-image")
    public Vehicle deleteImage(@PathVariable Long id) {
        return service.deleteImage(id);
    }
}