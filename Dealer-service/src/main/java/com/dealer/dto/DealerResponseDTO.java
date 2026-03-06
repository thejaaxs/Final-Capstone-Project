package com.dealer.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class DealerResponseDTO {

    private Long dealerId;
    private String dealerName;
    private String address;
    private String contactNumber;
    private String email;
}
