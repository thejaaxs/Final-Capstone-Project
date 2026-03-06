package com.example.demo.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import com.example.demo.entity.*;
import com.example.demo.service.FavoritesService;

import java.util.List;

@RestController
@RequestMapping("/favorites")
@RequiredArgsConstructor
public class FavoritesController {

    private final FavoritesService service;

    // 1️⃣ Add Dealer
    @PostMapping("/add")
    public Favorites add(@RequestBody Favorites favorite){
        return service.add(favorite);
    }

    // 2️⃣ Delete by Dealer Name
    @DeleteMapping("/deleteByName")
    public String deleteByName(@RequestParam String name){
        service.deleteByName(name);
        return "Deleted Successfully";
    }

    // 3️⃣ Delete by Product Name
    @DeleteMapping("/deleteByProductName")
    public String deleteByProduct(@RequestParam String product){
        service.deleteByProductName(product);
        return "Deleted Successfully";
    }

    // 4️⃣ Update Dealer by Name
    @PutMapping("/updateByName")
    public Favorites update(@RequestParam String name,
                            @RequestBody Favorites favorite){
        return service.updateByName(name, favorite);
    }

    // 5️⃣ List All Dealers
    @GetMapping("/list")
    public List<Favorites> list(){
        return service.listAll();
    }

    // 6️⃣ List By Reason
    @GetMapping("/listByReason")
    public List<Favorites> listByReason(@RequestParam String reason){
        return service.listByReason(reason);
    }

    // 7️⃣ List By Name  ✅ (Missing API Added)
    @GetMapping("/byName")
    public List<Favorites> listByName(@RequestParam String name){
        return service.listByName(name);
    }
}