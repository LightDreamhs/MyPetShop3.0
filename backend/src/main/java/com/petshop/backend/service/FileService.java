package com.petshop.backend.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * 文件服务接口
 */
public interface FileService {

    /**
     * 上传图片
     *
     * @param file 图片文件
     * @return 访问URL
     * @throws Exception 上传失败
     */
    String uploadImage(MultipartFile file) throws Exception;
}
