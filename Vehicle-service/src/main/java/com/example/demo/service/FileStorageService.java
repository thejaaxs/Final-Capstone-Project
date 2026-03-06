package com.example.demo.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    // ============================
    // SAVE FILE
    // ============================
    public String saveFile(MultipartFile file) {
        try {
            File folder = new File(uploadDir);
            if (!folder.exists()) {
                folder.mkdirs();
            }

            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path path = Paths.get(uploadDir + File.separator + fileName);
            Files.write(path, file.getBytes());

            return fileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    // ============================
    // DELETE FILE
    // ============================
    public void deleteFile(String fileName) {
        if (fileName == null) return;

        File file = new File(uploadDir + File.separator + fileName);
        if (file.exists() && !file.delete()) {
            System.out.println("Warning: Could not delete file " + fileName);
        }
    }

    // ============================
    // BUILD PUBLIC URL
    // ============================
    public String getFileUrl(String fileName) {
        if (fileName == null) return null;
        return "http://localhost:8085/uploads/" + fileName;
    }
}