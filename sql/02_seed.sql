-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: db_vendas
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `regioes`
--

LOCK TABLES `regioes` WRITE;
/*!40000 ALTER TABLE `regioes` DISABLE KEYS */;
INSERT INTO `regioes` VALUES (1,'norte',1.00),(2,'nordeste',1.00),(3,'sudeste',0.00),(4,'sul',0.50)
ON DUPLICATE KEY UPDATE
  `nome_regiao` = VALUES(`nome_regiao`),
  `percentual_bonus` = VALUES(`percentual_bonus`);
/*!40000 ALTER TABLE `regioes` ENABLE KEYS */;
UNLOCK TABLES;

-- Registros demonstrativos, separados dos dados temporários da jornada.
-- IDs são gerados pelo banco; NOT EXISTS permite executar este seed novamente.
INSERT INTO `vendedores` (`nome`, `meta_mensal`, `percentual_base`, `ativo`)
SELECT dados.`nome`, dados.`meta_mensal`, dados.`percentual_base`, 1
FROM (
  SELECT 'Seed Ana Lima' AS `nome`, 3000.00 AS `meta_mensal`, 5.00 AS `percentual_base`
  UNION ALL SELECT 'Seed Bruno Alves', 12000.00, 5.50
  UNION ALL SELECT 'Seed Carla Souza', 15000.00, 6.00
  UNION ALL SELECT 'Seed Diego Rocha', 9000.00, 4.50
  UNION ALL SELECT 'Seed Eva Martins', 11000.00, 5.00
) AS dados
WHERE NOT EXISTS (
  SELECT 1 FROM `vendedores` AS existente WHERE existente.`nome` = dados.`nome`
);

INSERT INTO `vendas`
  (`id_vendedor`, `id_regiao`, `data_venda`, `valor_venda`, `tipo_cliente`, `valor_comissao`)
SELECT vendedor.`id_vendedor`, dados.`id_regiao`, dados.`data_venda`,
       dados.`valor_venda`, dados.`tipo_cliente`, dados.`valor_comissao`
FROM (
  SELECT 'Seed Ana Lima' AS `nome`, 1 AS `id_regiao`, '2026-10-02 10:00:00' AS `data_venda`, 1200.00 AS `valor_venda`, 'PF' AS `tipo_cliente`, 96.00 AS `valor_comissao`
  UNION ALL SELECT 'Seed Ana Lima', 2, '2026-10-04 11:00:00', 1800.00, 'PJ', 162.00
  UNION ALL SELECT 'Seed Ana Lima', 3, '2026-10-06 12:00:00', 950.00, 'PF', 66.50
  UNION ALL SELECT 'Seed Bruno Alves', 4, '2026-10-08 13:00:00', 2300.00, 'PJ', 207.00
  UNION ALL SELECT 'Seed Bruno Alves', 1, '2026-10-10 14:00:00', 1500.00, 'PF', 127.50
  UNION ALL SELECT 'Seed Bruno Alves', 2, '2026-10-12 15:00:00', 3100.00, 'PJ', 294.50
  UNION ALL SELECT 'Seed Carla Souza', 3, '2026-10-14 10:30:00', 2700.00, 'PF', 216.00
  UNION ALL SELECT 'Seed Carla Souza', 4, '2026-10-16 11:30:00', 4200.00, 'PJ', 399.00
  UNION ALL SELECT 'Seed Carla Souza', 1, '2026-10-18 12:30:00', 1950.00, 'PF', 175.50
  UNION ALL SELECT 'Seed Diego Rocha', 2, '2026-10-20 13:30:00', 3600.00, 'PJ', 306.00
  UNION ALL SELECT 'Seed Diego Rocha', 3, '2026-10-22 14:30:00', 1100.00, 'PF', 71.50
  UNION ALL SELECT 'Seed Diego Rocha', 4, '2026-10-24 15:30:00', 2500.00, 'PJ', 200.00
  UNION ALL SELECT 'Seed Eva Martins', 1, '2026-10-25 10:15:00', 800.00, 'PF', 64.00
  UNION ALL SELECT 'Seed Eva Martins', 2, '2026-10-27 11:15:00', 1750.00, 'PJ', 157.50
  UNION ALL SELECT 'Seed Eva Martins', 3, '2026-10-29 12:15:00', 2200.00, 'PF', 154.00
) AS dados
INNER JOIN `vendedores` AS vendedor ON vendedor.`nome` = dados.`nome`
WHERE NOT EXISTS (
  SELECT 1
  FROM `vendas` AS existente
  WHERE existente.`id_vendedor` = vendedor.`id_vendedor`
    AND existente.`id_regiao` = dados.`id_regiao`
    AND existente.`data_venda` = dados.`data_venda`
    AND existente.`valor_venda` = dados.`valor_venda`
    AND existente.`tipo_cliente` = dados.`tipo_cliente`
);
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-17 11:08:09
