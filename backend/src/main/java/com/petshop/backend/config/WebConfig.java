package com.petshop.backend.config;

import com.petshop.backend.interceptor.JwtInterceptor;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Web配置类
 */
@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final JwtInterceptor jwtInterceptor;

    @Value("${file.upload-dir:uploads/images/}")
    private String uploadDir;

    private String absoluteUploadDir;

    @PostConstruct
    public void init() {
        // 获取项目根目录的绝对路径
        Path projectRoot = Paths.get(System.getProperty("user.dir"));
        absoluteUploadDir = projectRoot.resolve(uploadDir).toAbsolutePath().toString();
    }

    /**
     * 配置跨域
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

    /**
     * 配置拦截器
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(jwtInterceptor)
                .addPathPatterns("/**")
                .excludePathPatterns(
                        "/auth/login",
                        "/auth/register",
                        "/upload/**",
                        "/uploads/images/**",
                        "/api/v1/uploads/images/**",  // 排除包含 context-path 的静态资源路径
                        "/error",
                        "/swagger-resources/**",
                        "/v3/api-docs/**"
                );
    }

    /**
     * 配置静态资源映射
     * 将上传目录映射到 /uploads/images/** 路径，使上传的文件可以通过HTTP访问
     * 注意：由于有 context-path=/api/v1，实际访问路径是 /api/v1/uploads/images/**
     * Spring Boot 会自动在路径前加上 context-path，所以这里不需要写 /api/v1 前缀
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 映射上传目录到静态资源
        // URL路径 /uploads/images/** 会自动变成 /api/v1/uploads/images/**
        // 然后映射到 file:绝对路径/xxx.jpg
        registry.addResourceHandler("/uploads/images/**")
                .addResourceLocations("file:" + absoluteUploadDir.replace("\\", "/") + "/");
    }
}
