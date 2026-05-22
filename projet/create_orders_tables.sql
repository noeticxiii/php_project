-- Run this in phpMyAdmin on your `stock` database
-- Creates the orders and order_items tables needed for checkout

CREATE TABLE IF NOT EXISTS `orders` (
    `id_order`    INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_user`     INT UNSIGNED NOT NULL,
    `total_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `status`      ENUM('pending','confirmed','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
    `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id_order`),
    KEY `fk_order_user` (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `order_items` (
    `id_item`    INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_order`   INT UNSIGNED NOT NULL,
    `id_product` INT UNSIGNED NOT NULL,
    `quantity`   INT UNSIGNED NOT NULL DEFAULT 1,
    `unit_price` DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (`id_item`),
    KEY `fk_item_order`   (`id_order`),
    KEY `fk_item_product` (`id_product`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
