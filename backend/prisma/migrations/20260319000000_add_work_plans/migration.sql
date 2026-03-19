-- CreateTable
CREATE TABLE `work_plans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `plan_date` DATE NOT NULL,
    `plan_type` ENUM('WFH', 'OFFICE', 'FIELD', 'LEAVE') NOT NULL,
    `note` VARCHAR(500) NULL,
    `actual_note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `work_plans_plan_date_idx`(`plan_date`),
    INDEX `work_plans_user_id_idx`(`user_id`),
    UNIQUE INDEX `work_plans_user_id_plan_date_key`(`user_id`, `plan_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `work_plans` ADD CONSTRAINT `work_plans_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
