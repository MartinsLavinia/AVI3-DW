import { Router } from "express";
import registrarVenda from "#src/database/vendas/registrarVenda.js";
import excluirVenda from "#src/database/vendas/excluirVenda.js";
import listarVendas from "#src/database/vendas/listarVendas.js";
import consultarVendasPorVendedor from "#src/database/vendas/consultarVendasPorVendedor.js";
import consultarVendasPorRegiao from "#src/database/vendas/consultarVendasPorRegiao.js";

const router = Router();

function idValido(id) {
  return Number.isInteger(Number(id)) && Number(id) > 0;
}

router.post("/", async (req, res) => {
  const { idVendedor, idRegiao, dataVenda, valorVenda, tipoCliente } = req.body;

  if (
    !idValido(idVendedor) ||
    !idValido(idRegiao) ||
    !Number.isFinite(Number(valorVenda)) ||
    Number(valorVenda) <= 0 ||
    !["PF", "PJ"].includes(tipoCliente)
  ) {
    return res.status(400).json({ erro: "Dados da venda inválidos." });
  }

  try {
    const idVenda = await registrarVenda(
      Number(idVendedor),
      Number(idRegiao),
      dataVenda,
      Number(valorVenda),
      tipoCliente,
    );

    return res.status(201).json({ mensagem: "Venda registrada.", idVenda });
  } catch (error) {
    console.error("Erro ao registrar venda:", error.message);
    if (error.message.includes("inexistente")) {
      return res.status(404).json({ erro: error.message });
    }
    if (error.message.includes("inativo")) {
      return res.status(409).json({ erro: error.message });
    }
    return res.status(500).json({ erro: "Erro interno ao registrar venda." });
  }
});

router.get("/", async (_req, res) => {
  try {
    const vendas = await listarVendas();
    return res.status(200).json(vendas);
  } catch (error) {
    console.error("Erro ao listar vendas:", error.message);
    return res.status(500).json({ erro: "Erro interno ao listar vendas." });
  }
});

router.get("/vendedor/:id", async (req, res) => {
  const { id } = req.params;
  if (!idValido(id)) {
    return res.status(400).json({ erro: "O ID do vendedor deve ser um inteiro positivo." });
  }

  try {
    const vendas = await consultarVendasPorVendedor(Number(id));
    return res.status(200).json(vendas);
  } catch (error) {
    console.error("Erro ao consultar vendas do vendedor:", error.message);
    return res.status(500).json({ erro: "Erro interno ao consultar vendas do vendedor." });
  }
});

router.get("/regiao/:id", async (req, res) => {
  const { id } = req.params;
  if (!idValido(id)) {
    return res.status(400).json({ erro: "O ID da região deve ser um inteiro positivo." });
  }

  try {
    const vendas = await consultarVendasPorRegiao(Number(id));
    return res.status(200).json(vendas);
  } catch (error) {
    console.error("Erro ao consultar vendas da região:", error.message);
    return res.status(500).json({ erro: "Erro interno ao consultar vendas da região." });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!idValido(id)) {
    return res.status(400).json({ erro: "O ID da venda deve ser um inteiro positivo." });
  }

  try {
    const excluida = await excluirVenda(Number(id));
    if (!excluida) {
      return res.status(404).json({ erro: "Venda não encontrada." });
    }
    return res.status(200).json({ mensagem: "Venda excluída." });
  } catch (error) {
    console.error("Erro ao excluir venda:", error.message);
    return res.status(500).json({ erro: "Erro interno ao excluir venda." });
  }
});

export default router;
