package com.petshop.backend.service.impl;

import com.petshop.backend.exception.BusinessException;
import com.petshop.backend.service.FileService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.Arrays;
import java.util.UUID;

/**
 * 本地文件存储服务实现
 */
@Service
public class LocalFileServiceImpl implements FileService {

    @Value("${file.upload-dir:uploads/images/}")
    private String uploadDir;

    @Value("${file.server-domain:http://localhost:8080}")
    private String serverDomain;

    /**
     * 初始化时创建上传目录
     */
    @PostConstruct
    public void init() {
        File dir = new File(uploadDir);
        if (!dir.exists()) {
            boolean created = dir.mkdirs();
            if (created) {
                System.out.println("上传目录创建成功: " + dir.getAbsolutePath());
            }
        }
    }

    @Override
    public String uploadImage(MultipartFile file) throws Exception {
        // 1. 验证文件是否为空
        if (file.isEmpty()) {
            throw new BusinessException("文件不能为空");
        }

        // 2. 验证文件类型
        String contentType = file.getContentType();
        if (contentType == null || !Arrays.asList("image/jpeg", "image/jpg", "image/png").contains(contentType)) {
            throw new BusinessException("仅支持 JPG、JPEG、PNG 格式的图片");
        }

        // 3. 验证文件大小（5MB）
        long maxSize = 5 * 1024 * 1024;
        if (file.getSize() > maxSize) {
            throw new BusinessException("图片大小不能超过 5MB");
        }

        // 4. 生成唯一文件名
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new BusinessException("文件名不能为空");
        }

        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String filename = UUID.randomUUID() + extension;

        // 5. 保存文件
        File dest = new File(uploadDir + filename);
        file.transferTo(dest);

        // 6. 返回访问URL
        // 注意：由于 context-path 是 /api/v1，需要从完整路径中排除它
        // 访问路径应该是：http://localhost:8080/uploads/images/xxx.jpg
        return serverDomain + "/uploads/images/" + filename;
    }
}
