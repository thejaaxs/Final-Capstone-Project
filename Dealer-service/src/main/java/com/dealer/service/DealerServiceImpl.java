package com.dealer.service;

import com.dealer.dto.*;
import com.dealer.entity.Dealer;
import com.dealer.exception.*;
import com.dealer.repository.DealerRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DealerServiceImpl implements DealerService {

    private final DealerRepository repository;

    @Override
    public DealerResponseDTO addDealer(DealerRequestDTO dto) {

        if (repository.existsByDealerName(dto.getDealerName())) {
            throw new DealerAlreadyExistsException("Dealer already exists");
        }

        Dealer dealer = Dealer.builder()
                .dealerName(dto.getDealerName())
                .address(dto.getAddress())
                .contactNumber(dto.getContactNumber())
                .email(dto.getEmail())
                .build();

        Dealer savedDealer = repository.save(dealer);

        return mapToDTO(savedDealer);
    }

    @Override
    public DealerResponseDTO updateDealer(Long id, DealerRequestDTO dto) {

        Dealer dealer = repository.findById(id)
                .orElseThrow(() -> new DealerNotFoundException("Dealer not found"));

        dealer.setDealerName(dto.getDealerName());
        dealer.setAddress(dto.getAddress());
        dealer.setContactNumber(dto.getContactNumber());
        dealer.setEmail(dto.getEmail());

        Dealer updatedDealer = repository.save(dealer);

        return mapToDTO(updatedDealer);
    }

    @Override
    public void deleteDealer(Long id) {

        Dealer dealer = repository.findById(id)
                .orElseThrow(() -> new DealerNotFoundException("Dealer not found"));

        repository.delete(dealer);
    }

    @Override
    public DealerResponseDTO getDealerById(Long id) {

        Dealer dealer = repository.findById(id)
                .orElseThrow(() -> new DealerNotFoundException("Dealer not found"));

        return mapToDTO(dealer);
    }

    @Override
    public List<DealerResponseDTO> getAllDealers() {

        return repository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private DealerResponseDTO mapToDTO(Dealer dealer) {
        return DealerResponseDTO.builder()
                .dealerId(dealer.getDealerId())
                .dealerName(dealer.getDealerName())
                .address(dealer.getAddress())
                .contactNumber(dealer.getContactNumber())
                .email(dealer.getEmail())
                .build();
    }
}
