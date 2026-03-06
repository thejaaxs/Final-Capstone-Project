package com.dealer.repository;

import com.dealer.entity.Dealer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DealerRepository extends JpaRepository<Dealer, Long> {

    Optional<Dealer> findByDealerName(String dealerName);

    boolean existsByDealerName(String dealerName);
}
