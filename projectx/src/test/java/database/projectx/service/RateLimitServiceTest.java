package database.projectx.service;

import io.github.bucket4j.Bucket;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimitServiceTest {

    private final RateLimitService rateLimitService = new RateLimitService();

    @Test
    void resolveBucket_shouldLimitRequests() {
        String ip = "192.168.1.1";
        long capacity = 3;
        Duration duration = Duration.ofMinutes(1);

        Bucket bucket = rateLimitService.resolveBucket(ip, capacity, duration);

        assertThat(bucket.tryConsume(1)).isTrue();
        assertThat(bucket.tryConsume(1)).isTrue();
        assertThat(bucket.tryConsume(1)).isTrue();
        
        assertThat(bucket.tryConsume(1)).isFalse();
    }

    @Test
    void resolveBucket_shouldReturnSameBucketForSameIp() {
        Bucket b1 = rateLimitService.resolveBucket("1.1.1.1", 10, Duration.ofMinutes(1));
        Bucket b2 = rateLimitService.resolveBucket("1.1.1.1", 10, Duration.ofMinutes(1));
        
        assertThat(b1).isSameAs(b2);
    }

    @Test
    void resolveBucket_shouldReturnDifferentBucketForDifferentIp() {
        Bucket first = rateLimitService.resolveBucket("1.1.1.1", 10, Duration.ofMinutes(1));
        Bucket second = rateLimitService.resolveBucket("2.2.2.2", 10, Duration.ofMinutes(1));

        assertThat(first).isNotSameAs(second);
    }
}