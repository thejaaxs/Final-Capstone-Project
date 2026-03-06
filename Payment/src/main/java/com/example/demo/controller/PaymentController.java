//package com.example.demo.controller;
//
//import com.example.demo.entity.Payment;
//import com.example.demo.service.PaymentService;
//import lombok.RequiredArgsConstructor;
//import org.springframework.web.bind.annotation.*;
//
//@RestController
//@RequestMapping("/payments")
//@RequiredArgsConstructor
//public class PaymentController {
//
//    private final PaymentService paymentService;
//
//    @PostMapping
//    public Payment pay(@RequestBody Payment payment) {
//        return paymentService.processPayment(payment);
//    }
//}


package com.example.demo.controller;

import com.example.demo.dto.*;
import com.example.demo.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    // ✅ Create Razorpay order
    @PostMapping("/create-order")
    @ResponseStatus(HttpStatus.CREATED)
    public CreateRazorpayOrderResponse createOrder(@Valid @RequestBody CreateRazorpayOrderRequest req) {
        return paymentService.createRazorpayOrder(req);
    }

    // ✅ Verify payment + confirm booking
    @PostMapping("/verify")
    public VerifyPaymentResponse verify(@Valid @RequestBody VerifyPaymentRequest req) {
        return paymentService.verifyPayment(req);
    }
}