package com.example.demo.dto;

public class VehicleDto {
    private Long id;
    private String name;
    private String brand;
    private Double price;
    private Long dealerId;
    private String status;
    private String imageUrl;
    private Integer mileage;
    private String rideType;
    private Integer suitableDailyKm;

    public VehicleDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public Long getDealerId() { return dealerId; }
    public void setDealerId(Long dealerId) { this.dealerId = dealerId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public Integer getMileage() { return mileage; }
    public void setMileage(Integer mileage) { this.mileage = mileage; }

    public String getRideType() { return rideType; }
    public void setRideType(String rideType) { this.rideType = rideType; }

    public Integer getSuitableDailyKm() { return suitableDailyKm; }
    public void setSuitableDailyKm(Integer suitableDailyKm) { this.suitableDailyKm = suitableDailyKm; }
}