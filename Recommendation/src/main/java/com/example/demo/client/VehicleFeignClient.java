//package com.example.demo.client;
//
//import com.example.demo.dto.VehicleDto;
//import org.springframework.cloud.openfeign.FeignClient;
//import org.springframework.web.bind.annotation.GetMapping;
//
//import java.util.List;
//
//@FeignClient(name = "VEHICLE-SERVICE", url = "http://localhost:8085")
//public interface VehicleFeignClient {
//
//    @GetMapping("/vehicles")
//    List<VehicleDto> getAllVehicles();
//}

package com.example.demo.client;

import com.example.demo.dto.VehicleDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@FeignClient(name = "VEHICLE-SERVICE")
public interface VehicleFeignClient {

    @GetMapping("/vehicles")
    List<VehicleDto> getAllVehicles();
}