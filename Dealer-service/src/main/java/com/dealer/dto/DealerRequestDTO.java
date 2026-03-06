package com.dealer.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DealerRequestDTO {

    @JsonAlias({"fullName", "name"})            // ✅ accepts register payload too
    @NotBlank
    private String dealerName;

    @NotBlank
    private String address;

    @JsonAlias({"mobileNo", "phone"})           // ✅ accepts register payload too
    private String contactNumber;

    @JsonAlias({"emailId"})                     // ✅ accepts register payload too
    @Email
    private String email;
}