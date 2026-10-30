package database.projectx.service;

import database.projectx.repository.UserRepository;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import database.projectx.dto.TagDto;
import database.projectx.exception.ResourceNotFoundException;
import database.projectx.model.Tags;
import database.projectx.repository.TagsRepository;

@Service 
public class TagService {
    private final UserRepository userRepository;
    private final TagsRepository tagsRepository;

    public TagService(TagsRepository tagsRepository, UserRepository userRepository) {
        this.tagsRepository = tagsRepository;
        this.userRepository = userRepository;
    }

    public List<TagDto> getAvailableTags(Long userId){
        return tagsRepository.findUserAndGlobalTags(userId).stream().map(TagDto::from).toList();
    }

    public TagResult createOrGetTag(Long userId, String rawName) {
        String name = rawName.trim();

        Optional<Tags> existing = tagsRepository.findByNameForUserOrGlobal(name, userId).stream().findFirst();

        if (existing.isPresent()) {
            return new TagResult(TagDto.from(existing.get()), false);
        }

        Tags tag = new Tags();
        tag.setUser(userRepository.getReferenceById(userId));
        tag.setName(name);
        tag = tagsRepository.save(tag);

        return new TagResult(TagDto.from(tag), true);
    }

    public void deleteTag(Long userId, Long tagId) {
        Tags tag = tagsRepository.findByIdAndUserId(tagId, userId).orElseThrow(() -> new ResourceNotFoundException("Тег не найден " + tagId));

        tagsRepository.delete(tag);
    }

    public record TagResult(TagDto tag, boolean created) {}
}
