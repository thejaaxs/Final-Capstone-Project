package com.dealer.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "dealers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dealer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long dealerId;

    @Column(nullable = false, unique = true)
    private String dealerName;

    @Column(nullable = false)
    private String address;

    private String contactNumber;

    private String email;
}
