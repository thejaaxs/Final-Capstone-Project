package com.example.demo.dto;

public class RecommendationRequest {

    private String message;
    private ChatSession session;

    public RecommendationRequest() {
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public ChatSession getSession() {
        return session;
    }

    public void setSession(ChatSession session) {
        this.session = session;
    }
}