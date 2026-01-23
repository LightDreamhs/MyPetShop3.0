package com.petshop.backend;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 宠物店后台管理系统主应用类
 */
@SpringBootApplication
@MapperScan("com.petshop.backend.mapper")
public class PetShopBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(PetShopBackendApplication.class, args);
        System.out.println("宠物店后台管理系统启动成功！");
    }
}
