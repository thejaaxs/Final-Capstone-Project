package com.example.demo.service;

import com.example.demo.entity.Booking;
import com.example.demo.feign.DealerClient;
import com.example.demo.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final DealerClient dealerClient;

    @Override
    public Booking createBooking(Booking booking) {

        if (booking.getCustomerId() == null || booking.getDealerId() == null || booking.getVehicleId() == null) {
            throw new RuntimeException("customerId, dealerId and vehicleId are required");
        }

        booking.setBookingDate(LocalDateTime.now());

        // ✅ IMPORTANT FLOW
        booking.setBookingStatus("REQUESTED");
        booking.setPaymentStatus("UNPAID");

        booking.setCreatedAt(LocalDateTime.now());

        Booking saved = bookingRepository.save(booking);

        // ✅ Notify dealer: new booking request
        try {
            dealerClient.createNotification(
                    saved.getDealerId(),
                    new DealerClient.CreateNotificationRequest(
                            "BOOKING",
                            "New booking request #" + saved.getId() +
                                    " from customer #" + saved.getCustomerId()
                    )
            );
        } catch (Exception ignored) {
            // Do not fail booking if notification fails
        }

        return saved;
    }

    @Override
    public List<Booking> getBookingsByCustomer(Long customerId) {
        return bookingRepository.findByCustomerId(customerId);
    }

    @Override
    public List<Booking> getBookingsByDealer(Long dealerId) {
        return bookingRepository.findByDealerId(dealerId);
    }

    @Override
    public Booking cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // optional: prevent cancelling after paid
        if ("PAID".equalsIgnoreCase(booking.getPaymentStatus())) {
            throw new RuntimeException("Paid booking cannot be cancelled");
        }

        booking.setBookingStatus("CANCELLED");
        return bookingRepository.save(booking);
    }

    @Override
    public Booking acceptBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!"REQUESTED".equalsIgnoreCase(booking.getBookingStatus())) {
            throw new RuntimeException("Only REQUESTED bookings can be accepted");
        }

        booking.setBookingStatus("ACCEPTED");
        return bookingRepository.save(booking);
    }

    @Override
    public Booking rejectBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!"REQUESTED".equalsIgnoreCase(booking.getBookingStatus())) {
            throw new RuntimeException("Only REQUESTED bookings can be rejected");
        }

        booking.setBookingStatus("REJECTED");
        return bookingRepository.save(booking);
    }

    @Override
    public Booking confirmBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // ✅ IMPORTANT FLOW: only accepted bookings can be confirmed/paid
        if (!"ACCEPTED".equalsIgnoreCase(booking.getBookingStatus())) {
            throw new RuntimeException("Booking is not approved by dealer yet");
        }

        booking.setBookingStatus("CONFIRMED");
        booking.setPaymentStatus("PAID");

        return bookingRepository.save(booking);
    }

    @Override
    public Booking getById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
    }
}