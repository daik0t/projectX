package database.projectx.controller;

import database.projectx.dto.CreateVideoRequest;
import database.projectx.dto.UpdateVideoTagsRequest;
import database.projectx.dto.VideoResponse;
import database.projectx.security.CustomUserDetails;
import database.projectx.service.VideoService;
import jakarta.validation.Valid;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;


@RestController 
@RequestMapping("/api/videos")
public class VideosController {
    private final VideoService videoService;

    public VideosController(VideoService videoService){
        this.videoService = videoService;
    }

    @GetMapping("/me")
    public ResponseEntity<List<VideoResponse>> getMyVideos(@AuthenticationPrincipal CustomUserDetails principal){
        List<VideoResponse> videos = videoService.getMyVideos(principal.getId());
        return ResponseEntity.ok(videos);
    }
    
    @PostMapping
    public ResponseEntity<VideoResponse> createVideo(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody CreateVideoRequest request) {

        VideoResponse response = videoService.createVideo(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVideo(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long id) {

        videoService.deleteVideo(principal.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/tags")
    public ResponseEntity<VideoResponse> replaceVideoTags(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateVideoTagsRequest request) {

        VideoResponse response = videoService.replaceVideoTags(principal.getId(), id, request.tagIds());
        return ResponseEntity.ok(response);
    }
}
