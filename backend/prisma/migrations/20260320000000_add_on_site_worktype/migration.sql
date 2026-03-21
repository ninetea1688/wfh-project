-- Add ON_SITE to WorkType enum
ALTER TABLE `attendances` MODIFY `work_type` ENUM('WFH', 'OFFICE', 'FIELD', 'ON_SITE') NOT NULL;

-- Add ON_SITE to PlanType enum
ALTER TABLE `work_plans` MODIFY `plan_type` ENUM('WFH', 'OFFICE', 'FIELD', 'LEAVE', 'ON_SITE') NOT NULL;
