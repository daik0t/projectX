package database.projectx.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import database.projectx.dto.CreateTagRequest;
import database.projectx.dto.TagDto;
import database.projectx.security.CustomUserDetails;
import database.projectx.service.TagService;
import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController 
@RequestMapping ("/api/tags")
public class TagController {
    private final TagService tagService;

    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    @GetMapping 
    public ResponseEntity<List<TagDto>> getTags(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(tagService.getAvailableTags(principal.getId()));
    }

    @PostMapping
    public ResponseEntity<TagDto> createTag(@AuthenticationPrincipal CustomUserDetails principal, @Valid @RequestBody CreateTagRequest request) {
        TagService.TagResult result = tagService.createOrGetTag(principal.getId(), request.name());
        
        HttpStatus status = result.created() ? HttpStatus.CREATED : HttpStatus.OK;
        return ResponseEntity.status(status).body(result.tag());
    }
    
}
