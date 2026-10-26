import conexao from "#src/config/db.js";

export default async function gerarRelatorioPerformance(dataInicial, dataFinal) {
  if (!dataInicial || !dataFinal) throw new Error('Data inicial e/ou final inválida')

  const dataInicialAjustada = `${dataInicial} 00:00:00`
  const dataFinalAjustada = `${dataFinal} 23:59:59`;

  const queryTotalVendas = `
    SELECT COUNT(*) AS quantidade_vendas
    FROM vendas AS v
    WHERE v.data_venda BETWEEN ? AND ?
  `;
  const [resultTotalVendas] = await conexao.execute(queryTotalVendas, [dataInicialAjustada, dataFinalAjustada]);

  const queryVendasRegiao = `
    SELECT r.id_regiao, r.nome_regiao, SUM(v.valor_venda) AS total_vendido
    FROM vendas AS v
    INNER JOIN regioes AS r ON r.id_regiao = v.id_regiao
    WHERE v.data_venda BETWEEN ? AND ?
    GROUP BY r.id_regiao, r.nome_regiao
  `;
  const [resultVendasRegiao] = await conexao.execute(queryVendasRegiao, [dataInicialAjustada, dataFinalAjustada]);

  const queryVendasCliente = `
    SELECT v.tipo_cliente, SUM(v.valor_venda) AS total_vendido
    FROM vendas AS v
    WHERE v.data_venda BETWEEN ? AND ?
    GROUP BY v.tipo_cliente
  `;
  const [resultVendasCliente] = await conexao.execute(queryVendasCliente, [dataInicialAjustada, dataFinalAjustada]);

  const queryMelhorVendedor = `
    SELECT ve.id_vendedor, ve.nome, SUM(v.valor_venda) AS total_vendido
    FROM vendas AS v
    INNER JOIN vendedores AS ve ON ve.id_vendedor = v.id_vendedor
    WHERE v.data_venda BETWEEN ? AND ?
    GROUP BY ve.id_vendedor, ve.nome
    ORDER BY total_vendido DESC
    LIMIT 1
  `;
  const [resultMelhorVendedor] = await conexao.execute(queryMelhorVendedor, [dataInicialAjustada, dataFinalAjustada]);

  const queryMaiorComissao = `
    SELECT ve.id_vendedor, ve.nome, SUM(v.valor_comissao) AS comissao_acumulada
    FROM vendas AS v
    INNER JOIN vendedores AS ve ON ve.id_vendedor = v.id_vendedor
    WHERE v.data_venda BETWEEN ? AND ?
    GROUP BY ve.id_vendedor, ve.nome
    ORDER BY comissao_acumulada DESC
    LIMIT 1
  `;
  const [resultMaiorComissao] = await conexao.execute(queryMaiorComissao, [dataInicialAjustada, dataFinalAjustada]);

  const queryMetasAtingidas = `
    SELECT COUNT(*) as total
    FROM (
      SELECT ve.id_vendedor, ve.meta_mensal, COALESCE(SUM(v.valor_venda), 0) AS total_vendido
      FROM vendedores AS ve
      LEFT JOIN vendas AS v
        ON v.id_vendedor = ve.id_vendedor
        AND v.data_venda >= ? AND v.data_venda < ?
      GROUP BY ve.id_vendedor, ve.meta_mensal
      HAVING total_vendido >= ve.meta_mensal
    ) AS vendedores_com_meta
  `;
  const [resultMetasAtingidas] = await conexao.execute(queryMetasAtingidas, [dataInicialAjustada, dataFinalAjustada]);

  const queryComissaoMedia = `
    SELECT AVG(v.valor_comissao) AS comissao_media
    FROM vendas AS v
    WHERE v.data_venda BETWEEN ? AND ?
  `;
  const [resultComissaoMedia] = await conexao.execute(queryComissaoMedia, [dataInicialAjustada, dataFinalAjustada]);

  const queryComissaoMediaRegiao = `
    SELECT r.id_regiao, r.nome_regiao, AVG(v.valor_comissao) AS comissao_media
    FROM vendas AS v
    INNER JOIN regioes AS r ON r.id_regiao = v.id_regiao
    WHERE v.data_venda BETWEEN ? AND ?
    GROUP BY r.id_regiao, r.nome_regiao
  `;
  const [resultComissaoMediaRegiao] = await conexao.execute(queryComissaoMediaRegiao, [dataInicialAjustada, dataFinalAjustada]);

  let vendasRegioes = {}

  resultVendasRegiao.forEach(regiao => {
    vendasRegioes[regiao.nome_regiao] = regiao.total_vendido
  })

  let vendasTipoCliente = {}

  resultVendasCliente.forEach(tipo => {
    vendasTipoCliente[tipo.tipo_cliente] = tipo.total_vendido
  })

  let mediaRegioes = {}

  resultComissaoMediaRegiao.forEach(regiao => {
    mediaRegioes[regiao.nome_regiao] = regiao.comissao_media
  })

  return {
    totalVendas: resultTotalVendas[0]['quantidade_vendas'],
    vendasPorRegiao: vendasRegioes,
    vendasPorTipoCliente: vendasTipoCliente,
    melhorVendedor: resultMelhorVendedor[0] ?? null,
    maiorComissao: resultMaiorComissao[0] ?? null,
    metasAtingidas: resultMetasAtingidas[0]['total'],
    comissaoMedia: resultComissaoMedia[0]['comissao_media'],
    comissaoMediaPorRegiao: mediaRegioes,
  };
}
