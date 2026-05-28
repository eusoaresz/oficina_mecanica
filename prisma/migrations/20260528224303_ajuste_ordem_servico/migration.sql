/*
  Warnings:

  - You are about to drop the column `veiculoId` on the `depositos` table. All the data in the column will be lost.
  - You are about to alter the column `data_entrada` on the `ordens_servico` table. The data in that column could be lost. The data in that column will be cast from `VarChar(60)` to `DateTime(3)`.
  - You are about to alter the column `data_saida` on the `ordens_servico` table. The data in that column could be lost. The data in that column will be cast from `VarChar(60)` to `DateTime(3)`.
  - You are about to alter the column `status` on the `ordens_servico` table. The data in that column could be lost. The data in that column will be cast from `SmallInt` to `Enum(EnumId(0))`.
  - You are about to drop the `vendas` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `clienteId` to the `depositos` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `depositos` DROP FOREIGN KEY `depositos_veiculoId_fkey`;

-- DropForeignKey
ALTER TABLE `vendas` DROP FOREIGN KEY `vendas_ordemServicoId_fkey`;

-- DropForeignKey
ALTER TABLE `vendas` DROP FOREIGN KEY `vendas_veiculoId_fkey`;

-- DropIndex
DROP INDEX `depositos_veiculoId_fkey` ON `depositos`;

-- AlterTable
ALTER TABLE `depositos` DROP COLUMN `veiculoId`,
    ADD COLUMN `clienteId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `ordens_servico` MODIFY `data_entrada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `data_saida` DATETIME(3) NULL,
    MODIFY `status` ENUM('ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_PAGAMENTO', 'CONCLUIDA', 'CANCELADA') NOT NULL DEFAULT 'ABERTA';

-- DropTable
DROP TABLE `vendas`;

-- AddForeignKey
ALTER TABLE `depositos` ADD CONSTRAINT `depositos_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
