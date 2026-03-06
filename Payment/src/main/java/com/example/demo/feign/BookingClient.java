package com.example.demo.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(name = "BOOKING")
public interface BookingClient {

    @GetMapping("/bookings/{id}")
    BookingDTO getBookingById(@PathVariable("id") Long id);

    @PutMapping("/bookings/confirm/{id}")
    BookingDTO confirmBooking(@PathVariable("id") Long id);

    class BookingDTO {
        public Long id;
        public Long customerId;
        public Long dealerId;
        public Double amount;
        public String bookingStatus;
        public String paymentStatus;
    }
}