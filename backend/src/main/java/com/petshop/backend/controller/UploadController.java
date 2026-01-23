package com.petshop.backend.controller;

import com.petshop.backend.dto.Result;
import com.petshop.backend.dto.UploadResponse;
import com.petshop.backend.exception.BusinessException;
import com.petshop.backend.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * 文件上传控制器
 */
@RestController
@RequestMapping("/upload")
@RequiredArgsConstructor
public class UploadController {

    private final FileService fileService;

    /**
     * 上传图片
     */
    @PostMapping("/image")
    public Result<UploadResponse> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String url = fileService.uploadImage(file);
            UploadResponse response = new UploadResponse(
                    url,
                    file.getOriginalFilename(),
                    file.getSize()
            );
            return Result.success("上传成功", response);
        } catch (BusinessException e) {
            return Result.error(e.getCode(), e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error(500, "文件上传失败");
        }
    }
}
