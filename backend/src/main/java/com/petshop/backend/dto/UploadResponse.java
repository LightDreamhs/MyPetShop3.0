package com.petshop.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 文件上传响应类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UploadResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 访问URL
     */
    private String url;

    /**
     * 文件名
     */
    private String filename;

    /**
     * 文件大小（字节）
     */
    private Long size;
}
