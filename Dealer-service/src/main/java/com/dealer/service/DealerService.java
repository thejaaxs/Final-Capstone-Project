package com.dealer.service;

import com.dealer.dto.*;
import java.util.List;

public interface DealerService {

    DealerResponseDTO addDealer(DealerRequestDTO dto);

    DealerResponseDTO updateDealer(Long id, DealerRequestDTO dto);

    void deleteDealer(Long id);

    DealerResponseDTO getDealerById(Long id);

    List<DealerResponseDTO> getAllDealers();
}
