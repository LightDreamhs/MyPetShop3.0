package com.petshop.backend.service.impl;

import com.petshop.backend.dto.PageResult;
import com.petshop.backend.dto.SaleCreateRequest;
import com.petshop.backend.dto.SaleResponse;
import com.petshop.backend.entity.*;
import com.petshop.backend.exception.BusinessException;
import com.petshop.backend.exception.InsufficientStockException;
import com.petshop.backend.mapper.*;
import com.petshop.backend.service.SaleService;
import com.petshop.backend.util.PaginationUtil;
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
    public SaleResponse createSale(SaleCreateRequest request, Long operatorId) {
        // 1. 验证商品库存
        List<Product> products = validateProductsAndGet(request.getItems());

        // 2. 验证会员余额
        if (request.isUseBalance() && request.getCustomerId() != null) {
            validateCustomerBalance(request.getCustomerId(), request.getTotalAmount());
        }

        // 3. 创建销售记录
        Sale sale = createSaleRecord(request);

        // 4. 创建销售项并扣减库存
        createSaleItemsAndDeductStock(sale.getId(), request.getItems(), products);

        // 5. 创建消费记录（会员）
        if (request.getCustomerId() != null) {
            createConsumptionRecord(request.getCustomerId(), sale.getId(),
                    request.getSaleDate(), request.getTotalAmount());
        }

        // 6. 处理余额支付
        if (request.isUseBalance() && request.getCustomerId() != null) {
            deductBalanceForSale(request.getCustomerId(), request.getTotalAmount(), operatorId);
        }

        // 7. 同步财务记录
        if (request.isRecordToAccounting()) {
            syncToAccounting(sale.getId(), request, products);
        }

        return new SaleResponse(sale.getId(), sale.getTotalAmount(), sale.getSaleDate());
    }

    /**
     * 验证商品存在性和库存
     */
    private List<Product> validateProductsAndGet(List<SaleCreateRequest.SaleItemRequest> items) {
        List<Product> products = new ArrayList<>();
        for (SaleCreateRequest.SaleItemRequest item : items) {
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
        return products;
    }

    /**
     * 验证会员余额是否充足
     */
    private void validateCustomerBalance(Long customerId, Long totalAmount) {
        Customer customer = customerMapper.findById(customerId);
        if (customer == null) {
            throw new BusinessException(2001, "客户不存在");
        }
        Long currentBalance = customer.getBalance() != null ? customer.getBalance() : 0L;
        if (currentBalance < totalAmount) {
            throw new BusinessException(3003, "余额不足");
        }
    }

    /**
     * 创建销售主记录
     */
    private Sale createSaleRecord(SaleCreateRequest request) {
        Sale sale = new Sale();
        sale.setCustomerId(request.getCustomerId());
        sale.setCustomerName(request.getCustomerName());
        sale.setTotalAmount(request.getTotalAmount());
        sale.setSaleDate(request.getSaleDate());
        sale.setRecordedToAccounting(false);
        sale.setPaidWithBalance(request.isUseBalance());
        saleMapper.insert(sale);
        return sale;
    }

    /**
     * 创建销售明细并扣减库存
     */
    private void createSaleItemsAndDeductStock(Long saleId, List<SaleCreateRequest.SaleItemRequest> items, List<Product> products) {
        for (int i = 0; i < items.size(); i++) {
            SaleCreateRequest.SaleItemRequest item = items.get(i);
            Product product = products.get(i);
            long subtotal = item.getUnitPrice() * item.getQuantity();

            SaleItem saleItem = new SaleItem();
            saleItem.setSaleId(saleId);
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
    }

    /**
     * 创建消费记录
     */
    private void createConsumptionRecord(Long customerId, Long saleId, String saleDate, Long totalAmount) {
        ConsumptionRecord consumptionRecord = new ConsumptionRecord();
        consumptionRecord.setCustomerId(customerId);
        consumptionRecord.setSaleId(saleId);
        consumptionRecord.setDate(saleDate);
        consumptionRecord.setItem("商品消费");
        consumptionRecord.setAmount(totalAmount);
        consumptionRecordMapper.insert(consumptionRecord);
    }

    /**
     * 余额支付处理
     */
    private void deductBalanceForSale(Long customerId, Long amount, Long operatorId) {
        Customer customer = customerMapper.findById(customerId);
        Long balanceBefore = customer.getBalance();
        Long balanceAfter = balanceBefore - amount;

        customer.setBalance(balanceAfter);
        customerMapper.updateBalance(customerId, balanceAfter);

        // 记录余额变动历史
        BalanceTransaction transaction = new BalanceTransaction();
        transaction.setCustomerId(customerId);
        transaction.setType(BalanceTransaction.TransactionType.DEDUCT);
        transaction.setAmount(amount);
        transaction.setBalanceBefore(balanceBefore);
        transaction.setBalanceAfter(balanceAfter);
        transaction.setDescription("商品消费");
        transaction.setOperatorId(operatorId);
        balanceTransactionMapper.insert(transaction);
    }

    /**
     * 同步财务记录
     */
    private void syncToAccounting(Long saleId, SaleCreateRequest request, List<Product> products) {
        Transaction transaction = new Transaction();
        transaction.setType("income");
        transaction.setAmount(request.getTotalAmount());
        transaction.setDescription(buildTransactionDescription(
                request.getCustomerName(), products, request.getItems(), request.getTotalAmount()));
        transaction.setDate(request.getSaleDate());
        transactionMapper.insert(transaction);

        saleMapper.updateTransactionId(saleId, transaction.getId());
    }

    @Override
    public PageResult<Sale> findByPage(Integer page, Integer pageSize, String startDate, String endDate) {
        Integer offset = PaginationUtil.calculateOffset(page, pageSize);

        List<Sale> list = saleMapper.findByPage(offset, pageSize, startDate, endDate);
        Long total = saleMapper.countByDateRange(startDate, endDate);

        return new PageResult<>(list, total, page, pageSize);
    }

    @Override
    public Sale findById(Long id) {
        // 使用关联查询一次性获取销售记录和明细，避免N+1查询
        Sale sale = saleMapper.findWithItemsById(id);
        if (sale == null) {
            throw new BusinessException(4004, "销售记录不存在");
        }

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
