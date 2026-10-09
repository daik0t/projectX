package database.projectx.controller;

import database.projectx.model.Videos;
import database.projectx.model.User;
import database.projectx.service.VideoService;

import java.util.Optional;

import org.springframework.web.bind.annotation.*;

@RestController 
@RequestMapping("/api/videos")
public class VideosController {
    private final VideoService videoService;

    public VideosController(VideoService videoService){
        this.videoService = videoService;
    }

    @GetMapping 
    public Optional<Videos> getAllVideos(User user) {
        return videoService.getAllVideos(user);
    }
}
