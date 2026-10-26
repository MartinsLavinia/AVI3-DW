import { Router } from "express";
import conexao from "#src/config/db.js";
import atualizarVendedor from "#src/database/vendedores/atualizarVendedor.js";
import cadastrarVendedor from "#src/database/vendedores/cadastrarVendedor.js";
import desativarVendedor from "#src/database/vendedores/desativarVendedor.js";
import listarVendedores from "#src/database/vendedores/listarVendedores.js";

const router = Router();

function idValido(id) {
  return Number.isInteger(Number(id)) && Number(id) > 0;
}

async function vendedorExiste(id) {
  const [rows] = await conexao.execute(
    "SELECT id_vendedor FROM vendedores WHERE id_vendedor = ?",
    [id],
  );
  return rows.length > 0;
}

router.post("/", async (req, res) => {
  const { nome, metaMensal, percentualBase } = req.body;

  if (
    typeof nome !== "string" ||
    nome.trim() === "" ||
    !Number.isFinite(Number(metaMensal)) ||
    Number(metaMensal) <= 0 ||
    !Number.isFinite(Number(percentualBase)) ||
    Number(percentualBase) < 0 ||
    Number(percentualBase) > 100
  ) {
    return res.status(400).json({ erro: "Dados do vendedor inválidos." });
  }

  try {
    const idVendedor = await cadastrarVendedor(
      nome.trim(),
      Number(metaMensal),
      Number(percentualBase),
    );

    return res.status(201).json({ mensagem: "Vendedor cadastrado.", idVendedor });
  } catch (error) {
    console.error("Erro ao cadastrar vendedor:", error.message);
    return res.status(500).json({ erro: "Erro interno ao cadastrar vendedor." });
  }
});

router.get("/", async (_req, res) => {
  try {
    const vendedores = await listarVendedores();
    return res.status(200).json(vendedores);
  } catch (error) {
    console.error("Erro ao listar vendedores:", error.message);
    return res.status(500).json({ erro: "Erro interno ao listar vendedores." });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!idValido(id)) {
    return res.status(400).json({ erro: "O ID do vendedor deve ser um inteiro positivo." });
  }

  try {
    const [vendedores] = await conexao.execute(
      "SELECT * FROM vendedores WHERE id_vendedor = ?",
      [Number(id)],
    );

    if (vendedores.length === 0) {
      return res.status(404).json({ erro: "Vendedor não encontrado." });
    }

    return res.status(200).json(vendedores[0]);
  } catch (error) {
    console.error("Erro ao consultar vendedor:", error.message);
    return res.status(500).json({ erro: "Erro interno ao consultar vendedor." });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { metaMensal, percentualBase } = req.body;

  if (!idValido(id)) {
    return res.status(400).json({ erro: "O ID do vendedor deve ser um inteiro positivo." });
  }
  if (
    !Number.isFinite(Number(metaMensal)) ||
    Number(metaMensal) <= 0 ||
    !Number.isFinite(Number(percentualBase)) ||
    Number(percentualBase) < 0 ||
    Number(percentualBase) > 100
  ) {
    return res.status(400).json({ erro: "Meta mensal ou percentual base inválido." });
  }

  try {
    const atualizado = await atualizarVendedor(
      Number(id),
      Number(metaMensal),
      Number(percentualBase),
    );

    if (!atualizado && !(await vendedorExiste(Number(id)))) {
      return res.status(404).json({ erro: "Vendedor não encontrado." });
    }

    return res.status(200).json({ mensagem: "Vendedor atualizado." });
  } catch (error) {
    console.error("Erro ao atualizar vendedor:", error.message);
    return res.status(500).json({ erro: "Erro interno ao atualizar vendedor." });
  }
});

router.patch("/:id/desativar", async (req, res) => {
  const { id } = req.params;
  if (!idValido(id)) {
    return res.status(400).json({ erro: "O ID do vendedor deve ser um inteiro positivo." });
  }

  try {
    const desativado = await desativarVendedor(Number(id));

    if (!desativado && !(await vendedorExiste(Number(id)))) {
      return res.status(404).json({ erro: "Vendedor não encontrado." });
    }

    return res.status(200).json({ mensagem: "Vendedor desativado." });
  } catch (error) {
    console.error("Erro ao desativar vendedor:", error.message);
    return res.status(500).json({ erro: "Erro interno ao desativar vendedor." });
  }
});

export default router;
