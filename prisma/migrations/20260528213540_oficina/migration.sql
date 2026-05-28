-- CreateTable
CREATE TABLE `clientes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(60) NOT NULL,
    `telefone` VARCHAR(20) NOT NULL,
    `saldo` DECIMAL(9, 2) NOT NULL DEFAULT 0,
    `email` VARCHAR(60) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `veiculos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `modelo` VARCHAR(30) NOT NULL,
    `marca` VARCHAR(30) NOT NULL,
    `placa` VARCHAR(40) NOT NULL,
    `ano` DECIMAL(4, 0) NOT NULL,
    `status` TEXT NULL,
    `clienteId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ordens_servico` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `data_entrada` VARCHAR(60) NOT NULL,
    `data_saida` VARCHAR(60) NOT NULL,
    `status` SMALLINT NOT NULL,
    `valor` DECIMAL(9, 2) NOT NULL,
    `VeiculoId` INTEGER NOT NULL,
    `ServicoId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `servicos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `descricao` VARCHAR(60) NOT NULL,
    `valor` DECIMAL(9, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `depositos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `veiculoId` INTEGER NOT NULL,
    `valor` DECIMAL(9, 2) NOT NULL,
    `tipo` ENUM('PIX', 'Dinheiro', 'Cartao') NOT NULL,
    `data` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `veiculoId` INTEGER NOT NULL,
    `ordemServicoId` INTEGER NOT NULL,
    `quant` SMALLINT NOT NULL,
    `preco` DECIMAL(9, 2) NOT NULL,
    `data` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `veiculos` ADD CONSTRAINT `veiculos_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordens_servico` ADD CONSTRAINT `ordens_servico_VeiculoId_fkey` FOREIGN KEY (`VeiculoId`) REFERENCES `veiculos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordens_servico` ADD CONSTRAINT `ordens_servico_ServicoId_fkey` FOREIGN KEY (`ServicoId`) REFERENCES `servicos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `depositos` ADD CONSTRAINT `depositos_veiculoId_fkey` FOREIGN KEY (`veiculoId`) REFERENCES `veiculos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendas` ADD CONSTRAINT `vendas_veiculoId_fkey` FOREIGN KEY (`veiculoId`) REFERENCES `veiculos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendas` ADD CONSTRAINT `vendas_ordemServicoId_fkey` FOREIGN KEY (`ordemServicoId`) REFERENCES `ordens_servico`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
