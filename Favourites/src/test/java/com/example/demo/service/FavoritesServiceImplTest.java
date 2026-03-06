package com.example.demo.service;

import com.example.demo.entity.Favorites;
import com.example.demo.exception.*;
import com.example.demo.repository.FavoritesRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class FavoritesServiceImplTest {

    @Mock
    private FavoritesRepository repo;

    @InjectMocks
    private FavoritesServiceImpl service;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
    }

    // =========================
    // ADD
    // =========================
    @Test
    void add_ShouldSave_WhenNotDuplicate() {

        Favorites fav = new Favorites();
        fav.setDealerName("Dealer1");

        when(repo.findByDealerNameIgnoreCase("Dealer1"))
                .thenReturn(Optional.empty());
        when(repo.save(fav)).thenReturn(fav);

        Favorites result = service.add(fav);

        assertNotNull(result);
        verify(repo).save(fav);
    }

    @Test
    void add_ShouldThrow_WhenDuplicate() {

        Favorites fav = new Favorites();
        fav.setDealerName("Dealer1");

        when(repo.findByDealerNameIgnoreCase("Dealer1"))
                .thenReturn(Optional.of(fav));

        assertThrows(DuplicateResourceException.class,
                () -> service.add(fav));
    }

    // =========================
    // DELETE BY NAME
    // =========================
    @Test
    void deleteByName_ShouldDelete_WhenExists() {

        Favorites fav = new Favorites();
        fav.setDealerName("Dealer1");

        when(repo.findByDealerNameIgnoreCase("Dealer1"))
                .thenReturn(Optional.of(fav));

        service.deleteByName("Dealer1");

        verify(repo).delete(fav);
    }

    @Test
    void deleteByName_ShouldThrow_WhenNotFound() {

        when(repo.findByDealerNameIgnoreCase("Dealer1"))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service.deleteByName("Dealer1"));
    }

    // =========================
    // DELETE BY PRODUCT
    // =========================
    @Test
    void deleteByProduct_ShouldDeleteAll_WhenFound() {

        List<Favorites> list = List.of(new Favorites());

        when(repo.findByProductNameIgnoreCase("Car"))
                .thenReturn(list);

        service.deleteByProductName("Car");

        verify(repo).deleteAll(list);
    }

    @Test
    void deleteByProduct_ShouldThrow_WhenNotFound() {

        when(repo.findByProductNameIgnoreCase("Car"))
                .thenReturn(Collections.emptyList());

        assertThrows(ResourceNotFoundException.class,
                () -> service.deleteByProductName("Car"));
    }

    // =========================
    // UPDATE
    // =========================
    @Test
    void updateByName_ShouldUpdate_WhenValid() {

        Favorites existing = new Favorites();
        existing.setDealerName("OldName");

        Favorites updated = new Favorites();
        updated.setDealerName("NewName");

        when(repo.findByDealerNameIgnoreCase("OldName"))
                .thenReturn(Optional.of(existing));

        when(repo.findByDealerNameIgnoreCase("NewName"))
                .thenReturn(Optional.empty());

        when(repo.save(existing)).thenReturn(existing);

        Favorites result = service.updateByName("OldName", updated);

        assertEquals("NewName", result.getDealerName());
    }

    @Test
    void updateByName_ShouldThrow_WhenNotFound() {

        when(repo.findByDealerNameIgnoreCase("OldName"))
                .thenReturn(Optional.empty());

        Favorites updated = new Favorites();
        updated.setDealerName("NewName");

        assertThrows(ResourceNotFoundException.class,
                () -> service.updateByName("OldName", updated));
    }

    @Test
    void updateByName_ShouldThrow_WhenDuplicateRename() {

        Favorites existing = new Favorites();
        existing.setDealerName("OldName");

        Favorites duplicate = new Favorites();
        duplicate.setDealerName("NewName");

        Favorites updated = new Favorites();
        updated.setDealerName("NewName");

        when(repo.findByDealerNameIgnoreCase("OldName"))
                .thenReturn(Optional.of(existing));

        when(repo.findByDealerNameIgnoreCase("NewName"))
                .thenReturn(Optional.of(duplicate));

        assertThrows(DuplicateResourceException.class,
                () -> service.updateByName("OldName", updated));
    }

    // =========================
    // LIST ALL
    // =========================
    @Test
    void listAll_ShouldReturnList() {

        List<Favorites> list = List.of(new Favorites());

        when(repo.findAll()).thenReturn(list);

        List<Favorites> result = service.listAll();

        assertEquals(1, result.size());
    }

    // =========================
    // LIST BY REASON
    // =========================
    @Test
    void listByReason_ShouldReturnFilteredList() {

        List<Favorites> list = List.of(new Favorites());

        when(repo.findByReasonContainingIgnoreCase("Near"))
                .thenReturn(list);

        List<Favorites> result = service.listByReason("Near");

        assertEquals(1, result.size());
    }

    // =========================
    // LIST BY NAME
    // =========================
    @Test
    void listByName_ShouldReturnDealer_WhenExists() {

        Favorites fav = new Favorites();
        fav.setDealerName("Dealer1");

        when(repo.findByDealerNameIgnoreCase("Dealer1"))
                .thenReturn(Optional.of(fav));

        List<Favorites> result = service.listByName("Dealer1");

        assertEquals(1, result.size());
    }

    @Test
    void listByName_ShouldThrow_WhenNotFound() {

        when(repo.findByDealerNameIgnoreCase("Dealer1"))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service.listByName("Dealer1"));
    }
}