-- CreateTable
CREATE TABLE `alunos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(40) NOT NULL,
    `turma` VARCHAR(3) NOT NULL,
    `responsavel` VARCHAR(40) NOT NULL,
    `email` VARCHAR(60) NOT NULL,
    `obs` TEXT NULL,
    `saldo` DECIMAL(9, 2) NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `produtos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(60) NOT NULL,
    `quant` SMALLINT NOT NULL,
    `preco` DECIMAL(9, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `depositos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `alunoId` INTEGER NOT NULL,
    `valor` DECIMAL(9, 2) NOT NULL,
    `tipo` ENUM('PIX', 'Dinheiro', 'Cartao') NOT NULL,
    `data` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `alunoId` INTEGER NOT NULL,
    `produtoId` INTEGER NOT NULL,
    `quant` SMALLINT NOT NULL,
    `preco` DECIMAL(9, 2) NOT NULL,
    `data` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `depositos` ADD CONSTRAINT `depositos_alunoId_fkey` FOREIGN KEY (`alunoId`) REFERENCES `alunos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendas` ADD CONSTRAINT `vendas_alunoId_fkey` FOREIGN KEY (`alunoId`) REFERENCES `alunos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendas` ADD CONSTRAINT `vendas_produtoId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `produtos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
