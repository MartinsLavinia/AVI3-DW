import { Router } from "express";
import gerarRelatorioPerformance from "#src/services/gerarRelatorioPerformance.js";

const router = Router();

function dataIsoValida(data) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data ?? "")) return false;
  const convertida = new Date(`${data}T00:00:00.000Z`);
  return Number.isFinite(convertida.getTime()) && convertida.toISOString().slice(0, 10) === data;
}

router.get("/performance", async (req, res) => {
  const { inicio, fim } = req.query;

  if (!dataIsoValida(inicio) || !dataIsoValida(fim) || inicio > fim) {
    return res.status(400).json({
      erro: "Informe datas válidas no formato YYYY-MM-DD, com inicio menor ou igual a fim.",
    });
  }

  try {
    const relatorio = await gerarRelatorioPerformance(inicio, fim);
    return res.status(200).json(relatorio);
  } catch (error) {
    console.error("Erro ao gerar relatório de performance:", error.message);
    return res.status(500).json({ erro: "Erro interno ao gerar relatório." });
  }
});

export default router;
