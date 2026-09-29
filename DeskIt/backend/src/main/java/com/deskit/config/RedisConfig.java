package com.deskit.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.time.Duration;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
@EnableCaching
public class RedisConfig {

    public static final String CACHE_OFFICES = "offices";
    public static final String CACHE_FLOORS = "floors";
    public static final String CACHE_EMPLOYEES = "employees";
    public static final String CACHE_FLOOR_MAPS = "floor-maps";
    public static final String CACHE_ELEMENT_TYPES = "element-types";
    public static final String CACHE_ASSIGNMENTS = "assignments";

    @Bean
    StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
        return new StringRedisTemplate(connectionFactory);
    }

    @Bean
    RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
        );

        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer(mapper);

        RedisCacheConfiguration defaults = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(5))
                .disableCachingNullValues()
                .prefixCacheNameWith("deskit:")
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(jsonSerializer));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaults)
                .withCacheConfiguration(CACHE_OFFICES, defaults.entryTtl(Duration.ofMinutes(15)))
                .withCacheConfiguration(CACHE_FLOORS, defaults.entryTtl(Duration.ofMinutes(10)))
                .withCacheConfiguration(CACHE_EMPLOYEES, defaults.entryTtl(Duration.ofMinutes(5)))
                .withCacheConfiguration(CACHE_FLOOR_MAPS, defaults.entryTtl(Duration.ofMinutes(5)))
                .withCacheConfiguration(CACHE_ELEMENT_TYPES, defaults.entryTtl(Duration.ofHours(1)))
                .withCacheConfiguration(CACHE_ASSIGNMENTS, defaults.entryTtl(Duration.ofMinutes(2)))
                .build();
    }
}
