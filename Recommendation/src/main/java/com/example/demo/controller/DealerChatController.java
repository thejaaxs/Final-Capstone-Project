package com.example.demo.controller;

import com.example.demo.dto.ChatResponse;
import com.example.demo.dto.ChatSession;
import com.example.demo.dto.RecommendationRequest;
import com.example.demo.dto.VehicleDto;
import com.example.demo.service.RecommendationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/dealer-chat")
public class DealerChatController {

    private final RecommendationService service;

    public DealerChatController(RecommendationService service) {
        this.service = service;
    }

    @PostMapping("/message")
    public ChatResponse message(@RequestBody RecommendationRequest request) {

        ChatSession session = request.getSession();
        String message = request.getMessage();

        if (session == null) {
            session = new ChatSession();
            session.setStep(1);

            ChatResponse response = new ChatResponse();
            response.setMessage("What is your budget range for the bike (₹)?");
            response.setSession(session);
            response.setRecommendations(null);
            return response;
        }

        String reply = "";
        List<VehicleDto> vehicles = null;

        switch (session.getStep()) {

            case 1:
                try {
                    session.setBudget(Double.parseDouble(message));
                    session.setStep(2);
                    reply = "On average, how many kilometers do you ride per day?";
                } catch (Exception e) {
                    reply = "What is your budget range for the bike (₹)?";
                }
                break;

            case 2:
                try {
                    session.setDailyKm(Double.parseDouble(message));
                    session.setStep(3);
                    reply = "Where will you mostly ride the bike? (CITY / HIGHWAY)";
                } catch (Exception e) {
                    reply = "Please enter daily km as a number.";
                }
                break;

            case 3:
                String ride = message.toUpperCase().trim();

                if (!ride.equals("CITY") && !ride.equals("HIGHWAY")) {
                    reply = "Please choose either CITY or HIGHWAY.";
                    break;
                }

                session.setRideType(ride);
                session.setStep(4);
                reply = "What minimum mileage (km/l) do you expect from the bike?";
                break;

            case 4:
                try {
                    session.setMileage(Integer.parseInt(message));
                    session.setStep(5);

                    vehicles = service.recommendFromUser(
                            session.getBudget(),
                            session.getDailyKm(),
                            session.getRideType(),
                            session.getMileage()
                    );

                    if (vehicles == null || vehicles.isEmpty()) {
                        reply = "No bikes found matching your preferences.";
                    } else {
                        reply = "Here are the best bikes for you:";
                    }

                } catch (Exception e) {
                    reply = "Please enter mileage as a number.";
                }
                break;

            default:
                reply = "Conversation completed. Refresh to start again.";
        }

        ChatResponse response = new ChatResponse();
        response.setMessage(reply);
        response.setSession(session);
        response.setRecommendations(vehicles);

        return response;
    }
}