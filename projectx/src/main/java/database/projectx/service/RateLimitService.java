package database.projectx.service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;

@Service 
public class RateLimitService {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public Bucket resolveBucket(String key, long capacity, Duration duration) {
        return buckets.computeIfAbsent(key, k -> createNewBucket(capacity, duration));
    }

    private Bucket createNewBucket(long capacity, Duration duration) {
        Bandwidth limit = Bandwidth.builder().capacity(capacity).refillGreedy(capacity, duration).build();
        return Bucket.builder().addLimit(limit).build();
    }
}
