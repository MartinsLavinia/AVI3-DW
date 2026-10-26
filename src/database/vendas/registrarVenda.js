import conexao from "#src/config/db.js";
import calcularComissao from "#src/services/calcularComissao.js";

export default async function registrarVenda(
  idVendedor,
  idRegiao,
  dataVenda,
  valorVenda,
  tipoCliente,
) {
  const valorNumerico = Number(valorVenda);

  if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
    throw new Error("O valor da venda deve ser um número positivo.");
  }

  if (tipoCliente !== "PF" && tipoCliente !== "PJ") {
    throw new Error("Tipo do cliente inválido. Use PF ou PJ.");
  }

  const queryPercentuais = `
    SELECT v.percentual_base, v.ativo, r.percentual_bonus
    FROM vendedores AS v
    INNER JOIN regioes AS r ON r.id_regiao = ?
    WHERE v.id_vendedor = ?
  `;
  
  const [rows] = await conexao.execute(queryPercentuais, [idRegiao, idVendedor]);

  if (rows.length === 0) {
    throw new Error("Vendedor ou região inexistente.");
  }

  const dados = rows[0];
  if (!dados.ativo) {
    throw new Error("Não foi possível registrar a venda: vendedor inativo.");
  }

  const percentualCliente = tipoCliente === "PF" ? 2 : 3;
  const percentuais = [
    Number(dados.percentual_base),
    percentualCliente,
    Number(dados.percentual_bonus),
  ];
  const valorComissao = calcularComissao(valorNumerico, percentuais);

  const incluiData = dataVenda !== undefined && dataVenda !== null && dataVenda !== "";
  const colunas = ["id_vendedor", "id_regiao"];
  const valores = ["?", "?"];
  const parametros = [idVendedor, idRegiao];

  if (incluiData) {
    colunas.push("data_venda");
    valores.push("?");
    parametros.push(dataVenda);
  }

  colunas.push("valor_venda", "tipo_cliente", "valor_comissao");
  valores.push("?", "?", "?");
  parametros.push(valorNumerico, tipoCliente, valorComissao);

  const queryInsert = `
    INSERT INTO vendas (${colunas.join(", ")})
    VALUES (${valores.join(", ")})
  `;
  const [result] = await conexao.execute(queryInsert, parametros);

  return result.insertId;
}
