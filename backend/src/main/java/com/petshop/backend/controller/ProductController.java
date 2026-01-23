package com.petshop.backend.controller;

import com.petshop.backend.dto.PageResult;
import com.petshop.backend.dto.Result;
import com.petshop.backend.entity.Product;
import com.petshop.backend.service.ProductService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 商品控制器
 */
@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    /**
     * 获取商品列表
     */
    @GetMapping
    public Result<PageResult<Product>> findByPage(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String search) {
        PageResult<Product> result = productService.findByPage(page, pageSize, search);
        return Result.success(result);
    }

    /**
     * 获取商品详情
     */
    @GetMapping("/{id}")
    public Result<Product> findById(@PathVariable Long id) {
        Product product = productService.findById(id);
        return Result.success(product);
    }

    /**
     * 创建商品
     */
    @PostMapping
    public Result<Product> create(@Valid @RequestBody ProductCreateRequest request) {
        Product product = new Product();
        product.setName(request.name());
        product.setPrice(request.price());
        product.setStock(request.stock());
        product.setImageUrl(request.imageUrl());
        product.setDescription(request.description());

        Product created = productService.create(product);
        return Result.success("创建成功", created);
    }

    /**
     * 更新商品
     */
    @PutMapping("/{id}")
    public Result<Product> update(@PathVariable Long id, @Valid @RequestBody ProductUpdateRequest request) {
        Product product = new Product();
        product.setName(request.name());
        product.setPrice(request.price());
        product.setStock(request.stock());
        product.setImageUrl(request.imageUrl());
        product.setDescription(request.description());

        Product updated = productService.update(id, product);
        return Result.success("更新成功", updated);
    }

    /**
     * 修改商品库存
     */
    @PatchMapping("/{id}/stock")
    public Result<Void> updateStock(
            @PathVariable Long id,
            @Valid @RequestBody StockUpdateRequest request) {
        productService.updateStock(id, request.stock());
        return Result.success("库存更新成功", null);
    }

    /**
     * 删除商品
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteById(@PathVariable Long id) {
        productService.deleteById(id);
        return Result.success("删除成功", null);
    }

    /**
     * 创建商品请求DTO
     */
    public record ProductCreateRequest(
            @NotBlank(message = "商品名称不能为空")
            String name,
            @NotNull(message = "价格不能为空")
            @Min(value = 1, message = "价格必须大于0")
            Long price,
            @NotNull(message = "库存不能为空")
            @Min(value = 0, message = "库存不能为负数")
            Integer stock,
            @NotBlank(message = "商品图片不能为空")
            String imageUrl,
            String description
    ) {
    }

    /**
     * 更新商品请求DTO
     */
    public record ProductUpdateRequest(
            @NotBlank(message = "商品名称不能为空")
            String name,
            @NotNull(message = "价格不能为空")
            @Min(value = 1, message = "价格必须大于0")
            Long price,
            @NotNull(message = "库存不能为空")
            @Min(value = 0, message = "库存不能为负数")
            Integer stock,
            @NotBlank(message = "商品图片不能为空")
            String imageUrl,
            String description
    ) {
    }

    /**
     * 库存更新请求DTO
     */
    public record StockUpdateRequest(
            @NotNull(message = "库存不能为空")
            @Min(value = 0, message = "库存不能为负数")
            Integer stock
    ) {
    }
}
