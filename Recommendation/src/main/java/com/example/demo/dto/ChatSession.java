package com.example.demo.dto;

public class ChatSession {

    private int step = 1;
    private double budget;
    private double dailyKm;
    private String rideType;
    private int mileage;

    public ChatSession() {
    }

    public int getStep() {
        return step;
    }

    public void setStep(int step) {
        this.step = step;
    }

    public double getBudget() {
        return budget;
    }

    public void setBudget(double budget) {
        this.budget = budget;
    }

    public double getDailyKm() {
        return dailyKm;
    }

    public void setDailyKm(double dailyKm) {
        this.dailyKm = dailyKm;
    }

    public String getRideType() {
        return rideType;
    }

    public void setRideType(String rideType) {
        this.rideType = rideType;
    }

    public int getMileage() {
        return mileage;
    }

    public void setMileage(int mileage) {
        this.mileage = mileage;
    }
}