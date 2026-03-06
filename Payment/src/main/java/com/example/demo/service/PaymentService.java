//package com.example.demo.service;
//
//import com.example.demo.entity.Payment;
//import com.example.demo.repository.PaymentRepository;
//import com.example.demo.feign.BookingClient;
//import lombok.RequiredArgsConstructor;
//import org.springframework.stereotype.Service;
//
//import java.time.LocalDateTime;
//import java.util.Random;
//
//@Service
//@RequiredArgsConstructor
//public class PaymentService {
//
//    private final PaymentRepository paymentRepository;
//    private final BookingClient bookingClient;
//
//    public Payment processPayment(Payment payment) {
//
//        // 1️⃣ Check Booking Exists
//        bookingClient.getBookingById(payment.getBookingId());
//
//        // 2️⃣ Dummy Payment Logic
//        boolean success = new Random().nextBoolean();
//
//        if (success) {
//            payment.setPaymentStatus("SUCCESS");
//            payment.setTransactionId("TXN" + System.currentTimeMillis());
//            bookingClient.confirmBooking(payment.getBookingId());
//        } else {
//            payment.setPaymentStatus("FAILED");
//        }
//
//        payment.setPaymentDate(LocalDateTime.now());
//
//        return paymentRepository.save(payment);
//    }
//}

package com.example.demo.service;

import com.example.demo.dto.CreateRazorpayOrderRequest;
import com.example.demo.dto.CreateRazorpayOrderResponse;
import com.example.demo.dto.VerifyPaymentRequest;
import com.example.demo.dto.VerifyPaymentResponse;
import com.example.demo.entity.Payment;
import com.example.demo.feign.BookingClient;
import com.example.demo.feign.DealerClient;
import com.example.demo.repository.PaymentRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentService {

    private static final String MOCK_KEY_ID = "mock_key";
    private static final String MOCK_ORDER_PREFIX = "mock_order_";
    private static final String MOCK_PAYMENT_PREFIX = "mock_payment_";
    private static final String MOCK_SIGNATURE = "mock_signature";

    private final PaymentRepository paymentRepository;
    private final BookingClient bookingClient;
    private final DealerClient dealerClient;
    private final RazorpayClient razorpayClient;

    @Value("${razorpay.keyId}")
    private String keyId;

    @Value("${razorpay.keySecret}")
    private String keySecret;

    @Value("${payment.currency:INR}")
    private String currency;

    @Value("${payment.mock-fallback:true}")
    private boolean mockFallbackEnabled;

    public CreateRazorpayOrderResponse createRazorpayOrder(CreateRazorpayOrderRequest req) {

        if (req == null || req.getBookingId() == null || req.getCustomerId() == null) {
            throw new RuntimeException("bookingId and customerId are required");
        }

        // 1) Validate booking exists
        var booking = bookingClient.getBookingById(req.getBookingId());
        if (booking == null || booking.id == null) {
            throw new RuntimeException("Booking not found: " + req.getBookingId());
        }
        
        if (booking.customerId == null || !booking.customerId.equals(req.getCustomerId())) {
            throw new RuntimeException("This booking does not belong to this customer");
        }
        if ("PAID".equalsIgnoreCase(booking.paymentStatus)) {
            throw new RuntimeException("Booking already paid");
        }
        if (!"ACCEPTED".equalsIgnoreCase(booking.bookingStatus)) {
            throw new RuntimeException("Booking not approved by dealer yet");
        }
        if (booking.amount == null || booking.amount <= 0) {
            throw new RuntimeException("Invalid booking amount");
        }

        long amountInPaise = toPaiseSafe(booking.amount);

        if (keyId == null || keyId.isBlank() || keySecret == null || keySecret.isBlank()) {
            if (mockFallbackEnabled) {
                return createMockOrder(booking.id, booking.customerId, booking.amount, amountInPaise,
                        "Razorpay keys are not configured. Using local payment mode.");
            }
            throw new RuntimeException("Razorpay keys are not configured in application.properties");
        }

        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amountInPaise);
        orderRequest.put("currency", currency);
        orderRequest.put("receipt", "booking_" + booking.id);

        final String razorpayOrderId;
        try {
            Order order = razorpayClient.orders.create(orderRequest);
            razorpayOrderId = order.get("id");
        } catch (Exception e) {
            if (mockFallbackEnabled) {
                return createMockOrder(booking.id, booking.customerId, booking.amount, amountInPaise,
                        "Razorpay order creation failed. Using local payment mode.");
            }
            throw new RuntimeException("Razorpay order creation failed: " + e.getMessage());
        }

        Payment payment = Payment.builder()
                .bookingId(booking.id)
                .customerId(booking.customerId)
                .amount(booking.amount)
                .razorpayOrderId(razorpayOrderId)
                .paymentStatus("CREATED")
                .createdAt(LocalDateTime.now())
                .build();

        paymentRepository.save(payment);

        return CreateRazorpayOrderResponse.builder()
                .keyId(keyId)
                .currency(currency)
                .amountInPaise(amountInPaise)
                .razorpayOrderId(razorpayOrderId)
                .mockMode(false)
                .bookingId(booking.id)
                .customerId(booking.customerId)
                .build();
    }

    private CreateRazorpayOrderResponse createMockOrder(Long bookingId, Long customerId, Double amount, long amountInPaise, String message) {
        String mockOrderId = MOCK_ORDER_PREFIX + bookingId + "_" + System.currentTimeMillis();

        Payment payment = Payment.builder()
                .bookingId(bookingId)
                .customerId(customerId)
                .amount(amount)
                .razorpayOrderId(mockOrderId)
                .paymentStatus("CREATED")
                .createdAt(LocalDateTime.now())
                .build();

        paymentRepository.save(payment);

        return CreateRazorpayOrderResponse.builder()
                .keyId(MOCK_KEY_ID)
                .currency(currency)
                .amountInPaise(amountInPaise)
                .razorpayOrderId(mockOrderId)
                .mockMode(true)
                .message(message)
                .bookingId(bookingId)
                .customerId(customerId)
                .build();
    }

    private long toPaiseSafe(Double amountRupeesOrPaise) {
        if (amountRupeesOrPaise == null) {
            throw new RuntimeException("Invalid booking amount");
        }

        // If amount looks like it's already in paise (very common bug):
        // Example: 50000.0 means ₹500.00 if rupees, but could be 50,000 paise (₹500)
        // We'll treat values >= 100000 as paise already (₹1000+ in paise)
        double v = amountRupeesOrPaise;

        // If value is extremely large, assume it's already paise
        if (v >= 100000) {
            long paise = Math.round(v);
            validateRazorpayAmount(paise);
            return paise;
        }

        // Otherwise treat as rupees and convert
        long paise = Math.round(v * 100.0);
        validateRazorpayAmount(paise);
        return paise;
    }

    private void validateRazorpayAmount(long amountInPaise) {
        if (amountInPaise <= 0) {
            throw new RuntimeException("Invalid booking amount");
        }
        // safety limit for your app (₹0.50 to ₹10,00,000)
        long max = 100000000L; // ₹10,00,000 in paise
        if (amountInPaise > max) {
            throw new RuntimeException("Booking amount too large to pay online");
        }
    }
    
    public VerifyPaymentResponse verifyPayment(VerifyPaymentRequest req) {

        Payment payment = paymentRepository.findByRazorpayOrderId(req.getRazorpayOrderId())
                .orElseThrow(() -> new RuntimeException("Payment order not found: " + req.getRazorpayOrderId()));

        if (!payment.getBookingId().equals(req.getBookingId())
                || !payment.getCustomerId().equals(req.getCustomerId())) {
            throw new RuntimeException("Payment details do not match booking/customer");
        }

        boolean valid = isMockOrderId(req.getRazorpayOrderId())
                ? isValidMockPayment(req)
                : verifySignature(
                        req.getRazorpayOrderId(),
                        req.getRazorpayPaymentId(),
                        req.getRazorpaySignature()
                );

        if (!valid) {
            payment.setPaymentStatus("FAILED");
            payment.setRazorpayPaymentId(req.getRazorpayPaymentId());
            payment.setRazorpaySignature(req.getRazorpaySignature());
            payment.setPaymentDate(LocalDateTime.now());
            paymentRepository.save(payment);

            return VerifyPaymentResponse.builder()
                    .status("FAILED")
                    .message("Payment verification failed")
                    .bookingId(payment.getBookingId())
                    .transactionId(req.getRazorpayPaymentId())
                    .build();
        }

        // ✅ SUCCESS
        payment.setPaymentStatus("SUCCESS");
        payment.setRazorpayPaymentId(req.getRazorpayPaymentId());
        payment.setRazorpaySignature(req.getRazorpaySignature());
        payment.setTransactionId(req.getRazorpayPaymentId());
        payment.setPaymentDate(LocalDateTime.now());
        paymentRepository.save(payment);

        // ✅ Confirm booking
        bookingClient.confirmBooking(req.getBookingId());

        // ✅ Notify dealer (best effort)
        try {
            var booking = bookingClient.getBookingById(req.getBookingId());
            if (booking != null && booking.dealerId != null) {
                dealerClient.createNotification(
                        booking.dealerId,
                        new DealerClient.CreateNotificationRequest(
                                "PAYMENT",
                                "Payment received for Booking #" + booking.id + " (₹" + booking.amount + ")"
                        )
                );
            }
        } catch (Exception ignored) {
            // Do not fail payment if notification fails
        }

        return VerifyPaymentResponse.builder()
                .status("SUCCESS")
                .message(isMockOrderId(req.getRazorpayOrderId())
                        ? "Payment completed in local payment mode"
                        : "Payment verified and booking confirmed")
                .bookingId(req.getBookingId())
                .transactionId(req.getRazorpayPaymentId())
                .build();
    }

    private boolean isMockOrderId(String orderId) {
        return orderId != null && orderId.startsWith(MOCK_ORDER_PREFIX);
    }

    private boolean isValidMockPayment(VerifyPaymentRequest req) {
        return req.getRazorpayOrderId() != null
                && req.getRazorpayPaymentId() != null
                && req.getRazorpayPaymentId().startsWith(MOCK_PAYMENT_PREFIX)
                && MOCK_SIGNATURE.equals(req.getRazorpaySignature());
    }

    private boolean verifySignature(String orderId, String paymentId, String signature) {
        try {
            String payload = orderId + "|" + paymentId;

            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(
                    keySecret.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            );
            sha256Hmac.init(secretKey);

            byte[] hash = sha256Hmac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String generated = bytesToHex(hash);

            return generated.equals(signature);
        } catch (Exception e) {
            return false;
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) sb.append(String.format("%02x", b));
        return sb.toString();
    }
}
