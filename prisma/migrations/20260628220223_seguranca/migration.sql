-- AlterTable
ALTER TABLE `ordens_servico` ADD COLUMN `deleted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `deleted_at` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(60) NOT NULL,
    `email` VARCHAR(60) NOT NULL,
    `senha` VARCHAR(255) NOT NULL,
    `ultimo_login` DATETIME(3) NULL,
    `primeiro_acesso` BOOLEAN NOT NULL DEFAULT true,
    `codigo_recuperacao` VARCHAR(10) NULL,
    `codigo_expiracao` DATETIME(3) NULL,

    UNIQUE INDEX `usuarios_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NOT NULL,
    `acao` VARCHAR(100) NOT NULL,
    `detalhes` TEXT NULL,
    `ip` VARCHAR(45) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `logs` ADD CONSTRAINT `logs_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
