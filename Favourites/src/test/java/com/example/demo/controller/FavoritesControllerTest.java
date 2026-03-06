//package com.example.demo.controller;
//
//import com.example.demo.entity.Favorites;
//import com.example.demo.exception.DuplicateResourceException;
//import com.example.demo.exception.ResourceNotFoundException;
//import com.example.demo.service.FavoritesService;
//
//import org.junit.jupiter.api.Test;
//import org.mockito.Mockito;
//
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
//import org.springframework.boot.test.mock.mockito.MockBean;
//import org.springframework.context.annotation.Import;
//import org.springframework.security.test.context.support.WithMockUser;
//import org.springframework.test.web.servlet.MockMvc;
//
//import java.util.List;
//
//import static org.hamcrest.Matchers.*;
//import static org.mockito.Mockito.verify;
//import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
//import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
//
//@WebMvcTest(FavoritesController.class)
//
//class FavoritesControllerTest {
//
//    @Autowired
//    private MockMvc mockMvc;
//
//    @MockBean
//    private FavoritesService service;
//
//    // =========================
//    // ADD SUCCESS
//    // =========================
//    @Test
//    @WithMockUser
//    void add_ShouldReturnSavedFavorite() throws Exception {
//
//        Favorites fav = new Favorites();
//        fav.setDealerId(1L);
//        fav.setDealerName("TestDealer");
//        fav.setAddress("Chennai");
//        fav.setProductName("Car");
//        fav.setReason("Nearby");
//
//        Mockito.when(service.add(Mockito.any(Favorites.class)))
//                .thenReturn(fav);
//
//        mockMvc.perform(post("/favorites/add")
//                .contentType("application/json")
//                .content("""
//                        {
//                          "dealerId": 1,
//                          "dealerName": "TestDealer",
//                          "address": "Chennai",
//                          "productName": "Car",
//                          "reason": "Nearby"
//                        }
//                        """))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.dealerName", is("TestDealer")))
//                .andExpect(jsonPath("$.productName", is("Car")));
//
//        verify(service).add(Mockito.any(Favorites.class));
//    }
//
//    // =========================
//    // ADD DUPLICATE (409)
//    // =========================
//    @Test
//    @WithMockUser
//    void add_ShouldReturnConflict_WhenDuplicate() throws Exception {
//
//        Mockito.when(service.add(Mockito.any(Favorites.class)))
//                .thenThrow(new DuplicateResourceException("Dealer already exists"));
//
//        mockMvc.perform(post("/favorites/add")
//                .contentType("application/json")
//                .content("""
//                        {
//                          "dealerId": 1,
//                          "dealerName": "TestDealer",
//                          "address": "Chennai"
//                        }
//                        """))
//                .andExpect(status().isConflict());
//    }
//
//    // =========================
//    // DELETE NOT FOUND (404)
//    // =========================
//    @Test
//    @WithMockUser
//    void deleteByName_ShouldReturn404_WhenNotFound() throws Exception {
//
//        Mockito.doThrow(new ResourceNotFoundException("Not found"))
//                .when(service).deleteByName("TestDealer");
//
//        mockMvc.perform(delete("/favorites/deleteByName")
//                .param("name", "TestDealer"))
//                .andExpect(status().isNotFound());
//    }
//
//    // =========================
//    // UPDATE SUCCESS
//    // =========================
//    @Test
//    @WithMockUser
//    void updateByName_ShouldReturnUpdatedDealer() throws Exception {
//
//        Favorites updated = new Favorites();
//        updated.setDealerName("UpdatedDealer");
//
//        Mockito.when(service.updateByName(Mockito.eq("TestDealer"),
//                Mockito.any(Favorites.class)))
//                .thenReturn(updated);
//
//        mockMvc.perform(put("/favorites/updateByName")
//                .param("name", "TestDealer")
//                .contentType("application/json")
//                .content("""
//                        {
//                          "dealerName": "UpdatedDealer",
//                          "address": "Bangalore"
//                        }
//                        """))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.dealerName", is("UpdatedDealer")));
//    }
//
//    // =========================
//    // LIST ALL
//    // =========================
//    @Test
//    @WithMockUser
//    void list_ShouldReturnFavoritesList() throws Exception {
//
//        Favorites fav = new Favorites();
//        fav.setDealerName("Dealer1");
//
//        Mockito.when(service.listAll())
//                .thenReturn(List.of(fav));
//
//        mockMvc.perform(get("/favorites/list"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$", hasSize(1)))
//                .andExpect(jsonPath("$[0].dealerName", is("Dealer1")));
//    }
//
//    // =========================
//    // LIST BY NAME NOT FOUND
//    // =========================
//    @Test
//    @WithMockUser
//    void listByName_ShouldReturn404_WhenNotFound() throws Exception {
//
//        Mockito.when(service.listByName("Dealer1"))
//                .thenThrow(new ResourceNotFoundException("Not found"));
//
//        mockMvc.perform(get("/favorites/byName")
//                .param("name", "Dealer1"))
//                .andExpect(status().isNotFound());
//    }
//}