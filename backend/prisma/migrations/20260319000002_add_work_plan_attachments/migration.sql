-- CreateTable
CREATE TABLE `work_plan_attachments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `work_plan_id` INTEGER NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_size` INTEGER NULL,
    `mime_type` VARCHAR(100) NULL,
    `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `work_plan_attachments_work_plan_id_idx`(`work_plan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `work_plan_attachments` ADD CONSTRAINT `work_plan_attachments_work_plan_id_fkey` FOREIGN KEY (`work_plan_id`) REFERENCES `work_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
