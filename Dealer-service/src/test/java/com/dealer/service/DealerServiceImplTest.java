package com.dealer.service;

import com.dealer.dto.*;
import com.dealer.entity.Dealer;
import com.dealer.exception.*;
import com.dealer.repository.DealerRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DealerServiceImplTest {

    @Mock
    private DealerRepository repository;

    @InjectMocks
    private DealerServiceImpl service;

    private Dealer dealer;
    private DealerRequestDTO requestDTO;

    @BeforeEach
    void setUp() {

        dealer = Dealer.builder()
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

    @Test
    void addDealer_success() {
        when(repository.existsByDealerName("Honda")).thenReturn(false);
        when(repository.save(any())).thenReturn(dealer);

        DealerResponseDTO response = service.addDealer(requestDTO);

        assertEquals("Honda", response.getDealerName());
        verify(repository).save(any());
    }

    @Test
    void addDealer_shouldThrowException() {
        when(repository.existsByDealerName("Honda")).thenReturn(true);

        assertThrows(DealerAlreadyExistsException.class,
                () -> service.addDealer(requestDTO));
    }

    @Test
    void updateDealer_success() {
        when(repository.findById(1L)).thenReturn(Optional.of(dealer));
        when(repository.save(any())).thenReturn(dealer);

        DealerResponseDTO response = service.updateDealer(1L, requestDTO);

        assertEquals("Honda", response.getDealerName());
    }

    @Test
    void updateDealer_notFound() {
        when(repository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(DealerNotFoundException.class,
                () -> service.updateDealer(1L, requestDTO));
    }

    @Test
    void deleteDealer_success() {
        when(repository.findById(1L)).thenReturn(Optional.of(dealer));

        service.deleteDealer(1L);

        verify(repository).delete(dealer);
    }

    @Test
    void deleteDealer_notFound() {
        when(repository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(DealerNotFoundException.class,
                () -> service.deleteDealer(1L));
    }

    @Test
    void getDealerById_success() {
        when(repository.findById(1L)).thenReturn(Optional.of(dealer));

        DealerResponseDTO response = service.getDealerById(1L);

        assertEquals("Honda", response.getDealerName());
    }

    @Test
    void getDealerById_notFound() {
        when(repository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(DealerNotFoundException.class,
                () -> service.getDealerById(1L));
    }

    @Test
    void getAllDealers_success() {
        when(repository.findAll()).thenReturn(List.of(dealer));

        List<DealerResponseDTO> response = service.getAllDealers();

        assertEquals(1, response.size());
    }
}