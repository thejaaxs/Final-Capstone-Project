package com.example.demo.dto;

import java.util.List;

public class ChatResponse {

    private String message;
    private List<VehicleDto> recommendations;
    private ChatSession session;

    public ChatResponse() {
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<VehicleDto> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(List<VehicleDto> recommendations) {
        this.recommendations = recommendations;
    }

    public ChatSession getSession() {
        return session;
    }

    public void setSession(ChatSession session) {
        this.session = session;
    }
}