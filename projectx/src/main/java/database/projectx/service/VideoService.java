// Тут будет бизнес-логика по работе с видосами когда нибудь, а пока простые методы 
package database.projectx.service;

import database.projectx.model.User;
import database.projectx.model.Videos;
import database.projectx.repository.VideosRepository;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service 
public class VideoService {
    private final VideosRepository videosRepository;

    public VideoService(VideosRepository videosRepository){
        this.videosRepository = videosRepository;
    }

    public Optional<Videos> getAllVideos(User user) {
        return videosRepository.findByUserId(user);
    }
}
