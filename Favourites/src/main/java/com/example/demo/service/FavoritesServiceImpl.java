package com.example.demo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.client.CustomerClient;
import com.example.demo.repository.FavoritesRepository;
import com.example.demo.entity.Favorites;
import com.example.demo.exception.*;


import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class FavoritesServiceImpl implements FavoritesService {

    private final FavoritesRepository repo;
    private final CustomerClient customerClient;   // ✅ Feign injected

    // =========================
    // ADD FAVORITE
    // =========================
    @Override
    public Favorites add(Favorites favorite) {

        if (favorite == null) {
            throw new IllegalArgumentException("Favorite object cannot be null");
        }

        // 🔥 FEIGN VALIDATION (Customer must exist)
        customerClient.getCustomer(favorite.getCustomerId());

        String dealerName = favorite.getDealerName().trim();

        repo.findByDealerNameIgnoreCase(dealerName)
                .ifPresent(f -> {
                    throw new DuplicateResourceException(
                            "Dealer '" + dealerName + "' already exists in favorites");
                });

        favorite.setDealerName(dealerName);

        return repo.save(favorite);
    }

    // =========================
    // DELETE BY NAME
    // =========================
    @Override
    public void deleteByName(String name) {

        String dealerName = name.trim();

        Favorites existing = repo.findByDealerNameIgnoreCase(dealerName)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Dealer '" + dealerName + "' not found in favorites"));

        repo.delete(existing);
    }

    // =========================
    // DELETE BY PRODUCT NAME
    // =========================
    @Override
    public void deleteByProductName(String product) {

        String productName = product.trim();

        List<Favorites> favoritesList =
                repo.findByProductNameIgnoreCase(productName);

        if (favoritesList.isEmpty()) {
            throw new ResourceNotFoundException(
                    "No dealers found for product '" + productName + "'");
        }

        repo.deleteAll(favoritesList);
    }

    // =========================
    // UPDATE BY DEALER NAME
    // =========================
    @Override
    public Favorites updateByName(String name, Favorites updated) {

        String dealerName = name.trim();

        Favorites existing = repo.findByDealerNameIgnoreCase(dealerName)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Dealer '" + dealerName + "' not found"));

        String newName = updated.getDealerName().trim();

        // Prevent duplicate rename
        if (!dealerName.equalsIgnoreCase(newName)) {
            repo.findByDealerNameIgnoreCase(newName)
                    .ifPresent(f -> {
                        throw new DuplicateResourceException(
                                "Dealer '" + newName + "' already exists");
                    });
        }

        existing.setDealerName(newName);
        existing.setAddress(updated.getAddress());
        existing.setProductName(updated.getProductName());
        existing.setReason(updated.getReason());

        return repo.save(existing);
    }

    // =========================
    // LIST ALL
    // =========================
    @Override
    @Transactional(readOnly = true)
    public List<Favorites> listAll() {
        return repo.findAll();
    }

    // =========================
    // LIST BY REASON
    // =========================
    @Override
    @Transactional(readOnly = true)
    public List<Favorites> listByReason(String reason) {
        return repo.findByReasonContainingIgnoreCase(reason.trim());
    }

    // =========================
    // LIST BY NAME
    // =========================
    @Override
    @Transactional(readOnly = true)
    public List<Favorites> listByName(String name) {

        String dealerName = name.trim();

        Favorites favorite = repo.findByDealerNameIgnoreCase(dealerName)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Dealer '" + dealerName + "' not found"));

        return List.of(favorite);
    }
}