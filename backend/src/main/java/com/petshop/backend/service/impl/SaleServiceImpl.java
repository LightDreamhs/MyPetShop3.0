package com.petshop.backend.service.impl;

import com.petshop.backend.dto.PageResult;
import com.petshop.backend.dto.SaleCreateRequest;
import com.petshop.backend.dto.SaleResponse;
import com.petshop.backend.entity.*;
import com.petshop.backend.exception.BusinessException;
import com.petshop.backend.exception.InsufficientStockException;
import com.petshop.backend.mapper.*;
import com.petshop.backend.service.SaleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * 商品销售服务实现类
 */
@Service
@RequiredArgsConstructor
public class SaleServiceImpl implements SaleService {

    private final SaleMapper saleMapper;
    private final SaleItemMapper saleItemMapper;
    private final ProductMapper productMapper;
    private final TransactionMapper transactionMapper;
    private final ConsumptionRecordMapper consumptionRecordMapper;
    private final CustomerMapper customerMapper;
    private final BalanceTransactionMapper balanceTransactionMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SaleResponse createSale(SaleCreateRequest request) {
        // 1. 验证并获取所有商品信息
        List<Product> products = new ArrayList<>();
        for (SaleCreateRequest.SaleItemRequest item : request.getItems()) {
            Product product = productMapper.findById(item.getProductId());
            if (product == null) {
                throw new BusinessException(3001, "商品不存在: " + item.getProductId());
            }
            if (product.getStock() < item.getQuantity()) {
                throw new InsufficientStockException(
                        product.getName(), product.getStock(), item.getQuantity());
            }
            products.add(product);
        }

        // 2. 验证会员余额（如果使用余额支付）
        if (request.isUseBalance() && request.getCustomerId() != null) {
            Customer customer = customerMapper.findById(request.getCustomerId());
            if (customer == null) {
                throw new BusinessException(2001, "客户不存在");
            }
            Long currentBalance = customer.getBalance() != null ? customer.getBalance() : 0L;
            if (currentBalance < request.getTotalAmount()) {
                throw new BusinessException(3003, "余额不足");
            }
        }

        // 3. 创建销售记录
        Sale sale = new Sale();
        sale.setCustomerId(request.getCustomerId());
        sale.setCustomerName(request.getCustomerName());
        sale.setTotalAmount(request.getTotalAmount());
        sale.setSaleDate(request.getSaleDate());
        sale.setRecordedToAccounting(false);
        sale.setPaidWithBalance(request.isUseBalance());
        saleMapper.insert(sale);

        // 4. 创建销售项并扣减库存
        for (int i = 0; i < request.getItems().size(); i++) {
            SaleCreateRequest.SaleItemRequest item = request.getItems().get(i);
            Product product = products.get(i);
            long subtotal = item.getUnitPrice() * item.getQuantity();

            SaleItem saleItem = new SaleItem();
            saleItem.setSaleId(sale.getId());
            saleItem.setProductId(item.getProductId());
            saleItem.setProductName(product.getName());
            saleItem.setQuantity(item.getQuantity());
            saleItem.setUnitPrice(item.getUnitPrice());
            saleItem.setSubtotal(subtotal);
            saleItemMapper.insert(saleItem);

            // 扣减库存（乐观锁）
            int rows = productMapper.deductStock(item.getProductId(), item.getQuantity());
            if (rows == 0) {
                throw new InsufficientStockException(
                        product.getName(), product.getStock(), item.getQuantity());
            }
        }

        // 5. 如果是会员，创建消费记录
        if (request.getCustomerId() != null) {
            ConsumptionRecord consumptionRecord = new ConsumptionRecord();
            consumptionRecord.setCustomerId(request.getCustomerId());
            consumptionRecord.setSaleId(sale.getId());
            consumptionRecord.setDate(request.getSaleDate());
            consumptionRecord.setItem("商品消费");
            consumptionRecord.setAmount(request.getTotalAmount());
            consumptionRecordMapper.insert(consumptionRecord);
        }

        // 6. 如果使用余额，扣减余额
        if (request.isUseBalance() && request.getCustomerId() != null) {
            Customer customer = customerMapper.findById(request.getCustomerId());
            Long balanceBefore = customer.getBalance();
            Long balanceAfter = balanceBefore - request.getTotalAmount();

            customer.setBalance(balanceAfter);
            customerMapper.updateBalance(request.getCustomerId(), balanceAfter);

            // 记录余额变动历史
            BalanceTransaction transaction = new BalanceTransaction();
            transaction.setCustomerId(request.getCustomerId());
            transaction.setType(BalanceTransaction.TransactionType.DEDUCT);
            transaction.setAmount(request.getTotalAmount());
            transaction.setBalanceBefore(balanceBefore);
            transaction.setBalanceAfter(balanceAfter);
            transaction.setDescription("商品消费");
            // TODO: 从 JWT 中获取操作人ID
            transaction.setOperatorId(1L);
            balanceTransactionMapper.insert(transaction);
        }

        // 7. 如果需要记账，创建财务记录
        if (request.isRecordToAccounting()) {
            Transaction transaction = new Transaction();
            transaction.setType("income");
            transaction.setAmount(request.getTotalAmount());
            transaction.setDescription(buildTransactionDescription(
                    request.getCustomerName(), products, request.getItems(), request.getTotalAmount()));
            transaction.setDate(request.getSaleDate());
            transactionMapper.insert(transaction);

            saleMapper.updateTransactionId(sale.getId(), transaction.getId());
        }

        return new SaleResponse(sale.getId(), sale.getTotalAmount(), sale.getSaleDate());
    }

    @Override
    public PageResult<Sale> findByPage(Integer page, Integer pageSize, String startDate, String endDate) {
        Integer offset = (page - 1) * pageSize;

        List<Sale> list = saleMapper.findByPage(offset, pageSize, startDate, endDate);
        Long total = saleMapper.countByDateRange(startDate, endDate);

        return new PageResult<>(list, total, page, pageSize);
    }

    @Override
    public Sale findById(Long id) {
        Sale sale = saleMapper.findById(id);
        if (sale == null) {
            throw new BusinessException(4004, "销售记录不存在");
        }

        // 查询销售项
        List<SaleItem> items = saleItemMapper.findBySaleId(id);
        // 注意：Sale 实体类需要添加 items 字段，或者在这里构建响应对象

        return sale;
    }

    private String buildTransactionDescription(String customerName,
                                               List<Product> products,
                                               List<SaleCreateRequest.SaleItemRequest> items,
                                               Long totalAmount) {
        StringBuilder desc = new StringBuilder();
        desc.append(customerName).append("-");

        // 拼接商品信息
        for (int i = 0; i < items.size(); i++) {
            if (i > 0) desc.append(" + ");
            SaleCreateRequest.SaleItemRequest item = items.get(i);
            Product product = products.get(i);
            // 格式: 商品名 单价x数量
            desc.append(product.getName())
                .append(" ").append(String.format("%.2f", item.getUnitPrice() / 100.0))
                .append("x").append(item.getQuantity());
        }

        // 拼接总金额
        desc.append(" = ").append(String.format("%.2f", totalAmount / 100.0)).append("元");

        return desc.toString();
    }
}
