-- AlterTable - add OFFICE to WorkType enum
ALTER TABLE `attendances` MODIFY COLUMN `work_type` ENUM('WFH', 'OFFICE', 'FIELD') NOT NULL;
