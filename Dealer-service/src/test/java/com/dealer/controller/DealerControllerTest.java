package com.dealer.controller;

import com.dealer.dto.DealerRequestDTO;
import com.dealer.dto.DealerResponseDTO;
import com.dealer.exception.DealerNotFoundException;
import com.dealer.service.DealerService;

import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DealerController.class)
class DealerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DealerService service;

    @Autowired
    private ObjectMapper objectMapper;

    private DealerResponseDTO responseDTO;
    private DealerRequestDTO requestDTO;

    @BeforeEach
    void setup() {

        responseDTO = DealerResponseDTO.builder()
                .dealerId(1L)
                .dealerName("Honda")
                .address("Chennai")
                .contactNumber("9999999999")
                .email("honda@gmail.com")
                .build();

        requestDTO = DealerRequestDTO.builder()
                .dealerName("Honda")
                .address("Chennai")
                .contactNumber("9999999999")
                .email("honda@gmail.com")
                .build();
    }

    // =========================
    // ADD DEALER
    // =========================

    @Test
    void addDealer_success() throws Exception {

        when(service.addDealer(any(DealerRequestDTO.class)))
                .thenReturn(responseDTO);

        mockMvc.perform(post("/dealers/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dealerName").value("Honda"));
    }

    // =========================
    // UPDATE DEALER
    // =========================

    @Test
    void updateDealer_success() throws Exception {

        when(service.updateDealer(eq(1L), any(DealerRequestDTO.class)))
                .thenReturn(responseDTO);

        mockMvc.perform(put("/dealers/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dealerName").value("Honda"));
    }

    // =========================
    // DELETE DEALER
    // =========================

    @Test
    void deleteDealer_success() throws Exception {

        doNothing().when(service).deleteDealer(1L);

        mockMvc.perform(delete("/dealers/1"))
                .andExpect(status().isOk())
                .andExpect(content().string("Dealer deleted successfully"));
    }

    // =========================
    // GET DEALER BY ID
    // =========================

    @Test
    void getDealer_success() throws Exception {

        when(service.getDealerById(1L)).thenReturn(responseDTO);

        mockMvc.perform(get("/dealers/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dealerName").value("Honda"));
    }

    @Test
    void getDealer_notFound() throws Exception {

        when(service.getDealerById(1L))
                .thenThrow(new DealerNotFoundException("Dealer not found"));

        mockMvc.perform(get("/dealers/1"))
                .andExpect(status().isNotFound());
    }

    // =========================
    // GET ALL DEALERS
    // =========================

    @Test
    void getAllDealers_success() throws Exception {

        when(service.getAllDealers())
                .thenReturn(List.of(responseDTO));

        mockMvc.perform(get("/dealers/list"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].dealerName").value("Honda"));
    }
}