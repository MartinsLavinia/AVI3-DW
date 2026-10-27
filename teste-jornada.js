import { spawn } from "node:child_process";
import { createServer } from "node:net";
import conexao from "./src/config/db.js";

const baseUrl = (process.env.TEST_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const nomesRegioes = ["norte", "nordeste", "sudeste", "sul"];
const idsVendedoresCriados = [];
const idsVendasCriadas = [];
let aprovados = 0;

function verificar(condicao, mensagem) {
  if (!condicao) throw new Error(mensagem);
  aprovados += 1;
  console.log(`✅ ${mensagem}`);
}

async function requisitar(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const texto = await response.text();
  let body;
  try {
    body = texto ? JSON.parse(texto) : null;
  } catch {
    body = texto;
  }
  return { response, body };
}

function dataMes(dia) {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const diaFormatado = String(dia).padStart(2, "0");
  return `${ano}-${mes}-${diaFormatado} 12:00:00`;
}

async function portaLivre() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function verificarErroDeConexao() {
  const port = await portaLivre();
  const child = spawn(process.execPath, ["src/index.js"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port), DB_PORT: "1" },
    stdio: "ignore",
    windowsHide: true,
  });

  try {
    let resultado;
    const limite = Date.now() + 10_000;
    while (Date.now() < limite) {
      if (child.exitCode !== null) throw new Error("A instância temporária da API encerrou antes do teste.");
      try {
        resultado = await requisitarEm(`http://127.0.0.1:${port}`, "/vendas");
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
    if (!resultado) throw new Error("A instância temporária da API não iniciou a tempo.");
    verificar(resultado.response.status === 500, "falha de conexão com MySQL resulta em HTTP 500");
  } finally {
    child.kill();
    await new Promise((resolve) => {
      if (child.exitCode !== null) return resolve();
      child.once("exit", resolve);
      setTimeout(resolve, 2_000).unref();
    });
  }
}

async function requisitarEm(url, path, options = {}) {
  const response = await fetch(`${url}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const texto = await response.text();
  let body;
  try {
    body = texto ? JSON.parse(texto) : null;
  } catch {
    body = texto;
  }
  return { response, body };
}

async function limparDadosDaJornada() {
  if (idsVendasCriadas.length > 0) {
    const placeholders = idsVendasCriadas.map(() => "?").join(", ");
    await conexao.execute(
      `DELETE FROM vendas WHERE id_venda IN (${placeholders})`,
      idsVendasCriadas,
    );
  }
  if (idsVendedoresCriados.length > 0) {
    const placeholders = idsVendedoresCriados.map(() => "?").join(", ");
    await conexao.execute(
      `DELETE FROM vendedores WHERE id_vendedor IN (${placeholders})`,
      idsVendedoresCriados,
    );
  }
  if (idsVendedoresCriados.length > 0 || idsVendasCriadas.length > 0) {
    console.log("🧹 Dados criados pela jornada removidos do banco.");
  }
}

async function executar() {
  console.log(`Iniciando teste de jornada em ${baseUrl}`);
  console.log("Os registros criados durante a jornada serão removidos ao final.");

  const marcador = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const vendedores = [];
  const cadastros = [
    { nome: `Jornada Ana ${marcador}`, metaMensal: 5000, percentualBase: 5 },
    { nome: `Jornada Bruno ${marcador}`, metaMensal: 999999, percentualBase: 5.5 },
    { nome: `Jornada Carla ${marcador}`, metaMensal: 999999, percentualBase: 6 },
    { nome: `Jornada Diego ${marcador}`, metaMensal: 999999, percentualBase: 4.5 },
    { nome: `Jornada Eva ${marcador}`, metaMensal: 999999, percentualBase: 5 },
  ];

  for (const vendedor of cadastros) {
    const { response, body } = await requisitar("/vendedores", {
      method: "POST",
      body: JSON.stringify(vendedor),
    });
    if (Number.isInteger(body?.idVendedor)) idsVendedoresCriados.push(body.idVendedor);
    verificar(response.status === 201 && Number.isInteger(body?.idVendedor), `cadastro de vendedor: ${vendedor.nome}`);
    vendedores.push({ ...vendedor, id: body.idVendedor });
  }

  const listaVendedores = await requisitar("/vendedores");
  verificar(listaVendedores.response.status === 200 && vendedores.every((v) => listaVendedores.body.some((item) => item.id_vendedor === v.id)), "listagem inclui os cinco vendedores cadastrados");

  const consultaVendedor = await requisitar(`/vendedores/${vendedores[0].id}`);
  verificar(consultaVendedor.response.status === 200 && consultaVendedor.body.id_vendedor === vendedores[0].id, "consulta de vendedor por código");

  const metaAtualizada = await requisitar(`/vendedores/${vendedores[0].id}`, {
    method: "PUT",
    body: JSON.stringify({ metaMensal: 1200, percentualBase: 5 }),
  });
  verificar(metaAtualizada.response.status === 200, "atualização da meta mensal e percentual base");
  const vendedorAtualizado = await requisitar(`/vendedores/${vendedores[0].id}`);
  verificar(Number(vendedorAtualizado.body?.meta_mensal) === 1200, "meta mensal atualizada foi persistida");

  const regioes = await conexao.execute("SELECT id_regiao, nome_regiao FROM regioes");
  const idsRegiao = new Map(regioes[0].map((r) => [String(r.nome_regiao).toLowerCase(), r.id_regiao]));
  verificar(nomesRegioes.every((nome) => idsRegiao.has(nome)), "banco contém as quatro regiões necessárias");

  const planoVendas = [
    { vendedor: 0, regiao: "norte", tipo: "PF", valor: 1200 },
    { vendedor: 0, regiao: "nordeste", tipo: "PJ", valor: 1800 },
    { vendedor: 0, regiao: "sudeste", tipo: "PF", valor: 950 },
    { vendedor: 1, regiao: "sul", tipo: "PJ", valor: 2300 },
    { vendedor: 1, regiao: "norte", tipo: "PF", valor: 1500 },
    { vendedor: 1, regiao: "nordeste", tipo: "PJ", valor: 3100 },
    { vendedor: 2, regiao: "sudeste", tipo: "PF", valor: 2700 },
    { vendedor: 2, regiao: "sul", tipo: "PJ", valor: 4200 },
    { vendedor: 2, regiao: "norte", tipo: "PF", valor: 1950 },
    { vendedor: 3, regiao: "nordeste", tipo: "PJ", valor: 3600 },
    { vendedor: 3, regiao: "sudeste", tipo: "PF", valor: 1100 },
    { vendedor: 3, regiao: "sul", tipo: "PJ", valor: 2500 },
    { vendedor: 4, regiao: "norte", tipo: "PF", valor: 800 },
    { vendedor: 4, regiao: "nordeste", tipo: "PJ", valor: 1750 },
    { vendedor: 4, regiao: "sudeste", tipo: "PF", valor: 2200 },
  ];

  for (let i = 0; i < planoVendas.length; i += 1) {
    const plano = planoVendas[i];
    const { response, body } = await requisitar("/vendas", {
      method: "POST",
      body: JSON.stringify({
        idVendedor: vendedores[plano.vendedor].id,
        idRegiao: idsRegiao.get(plano.regiao),
        dataVenda: dataMes(i + 1),
        valorVenda: plano.valor,
        tipoCliente: plano.tipo,
      }),
    });
    if (Number.isInteger(body?.idVenda)) idsVendasCriadas.push(body.idVenda);
    verificar(response.status === 201 && Number.isInteger(body?.idVenda), `registro de venda ${i + 1}/15 (${plano.regiao}, ${plano.tipo})`);
  }

  const comissaoExemplo = await conexao.execute("SELECT valor_comissao FROM vendas WHERE id_venda = ?", [idsVendasCriadas[0]]);
  verificar(Number(comissaoExemplo[0][0]?.valor_comissao) === 96, "comissão do exemplo calculada corretamente: R$ 96,00");

  const listaVendas = await requisitar("/vendas");
  verificar(listaVendas.response.status === 200 && idsVendasCriadas.every((id) => listaVendas.body.some((item) => item.id_venda === id)), "listagem contém as quinze vendas criadas");

  for (const vendedor of vendedores) {
    const consulta = await requisitar(`/vendas/vendedor/${vendedor.id}`);
    verificar(consulta.response.status === 200 && consulta.body.some((v) => v.id_vendedor === vendedor.id), `consulta de vendas por vendedor ${vendedor.id}`);
  }

  for (const nome of nomesRegioes) {
    const id = idsRegiao.get(nome);
    const consulta = await requisitar(`/vendas/regiao/${id}`);
    verificar(consulta.response.status === 200 && consulta.body.some((v) => v.id_regiao === id), `consulta de vendas da região ${nome}`);
  }

  const relatorio = await requisitar(`/relatorios/performance?inicio=${dataMes(1).slice(0, 7)}-01&fim=${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10)}`);
  const camposRelatorio = ["totalVendas", "vendasPorRegiao", "vendasPorTipoCliente", "melhorVendedor", "maiorComissao", "metasAtingidas", "comissaoMedia", "comissaoMediaPorRegiao"];
  verificar(relatorio.response.status === 200 && camposRelatorio.every((campo) => Object.hasOwn(relatorio.body, campo)), "relatório mensal retorna todos os indicadores exigidos");
  verificar(Number(relatorio.body.totalVendas) >= 15, "relatório mensal contabiliza pelo menos as quinze vendas da jornada");
  verificar(Number(relatorio.body.metasAtingidas) >= 1, "relatório identifica ao menos uma meta atingida no mês");
  verificar(nomesRegioes.every((nome) => Object.hasOwn(relatorio.body.vendasPorRegiao, nome)), "relatório apresenta vendas das quatro regiões");
  verificar(Object.hasOwn(relatorio.body.vendasPorTipoCliente, "PF") && Object.hasOwn(relatorio.body.vendasPorTipoCliente, "PJ"), "relatório apresenta vendas PF e PJ");

  const vendaExtra = await requisitar("/vendas", {
    method: "POST",
    body: JSON.stringify({ idVendedor: vendedores[0].id, idRegiao: idsRegiao.get("norte"), dataVenda: dataMes(20), valorVenda: 50, tipoCliente: "PF" }),
  });
  if (Number.isInteger(vendaExtra.body?.idVenda)) idsVendasCriadas.push(vendaExtra.body.idVenda);
  verificar(vendaExtra.response.status === 201, "criação de venda temporária para testar exclusão");
  const excluir = await requisitar(`/vendas/${vendaExtra.body.idVenda}`, { method: "DELETE" });
  verificar(excluir.response.status === 200, "exclusão de venda existente");
  const excluirInexistente = await requisitar(`/vendas/${vendaExtra.body.idVenda}`, { method: "DELETE" });
  verificar(excluirInexistente.response.status === 404, "tentativa de excluir venda ausente retorna 404");

  const vendaInvalida = await requisitar("/vendas", {
    method: "POST",
    body: JSON.stringify({ idVendedor: vendedores[0].id, idRegiao: idsRegiao.get("norte"), valorVenda: 0, tipoCliente: "PF" }),
  });
  verificar(vendaInvalida.response.status === 400, "venda com valor zero retorna 400");

  const vendedorInexistente = await requisitar("/vendas", {
    method: "POST",
    body: JSON.stringify({ idVendedor: 2147483647, idRegiao: idsRegiao.get("norte"), valorVenda: 50, tipoCliente: "PF" }),
  });
  verificar(vendedorInexistente.response.status === 404, "venda para vendedor inexistente retorna 404");

  const regiaoInexistente = await requisitar("/vendas", {
    method: "POST",
    body: JSON.stringify({ idVendedor: vendedores[0].id, idRegiao: 2147483647, valorVenda: 50, tipoCliente: "PF" }),
  });
  verificar(regiaoInexistente.response.status === 404, "venda para região inexistente retorna 404");

  const duplicada = {
    id: idsVendasCriadas[0],
    idVendedor: vendedores[0].id,
    idRegiao: idsRegiao.get(planoVendas[0].regiao),
    valor: planoVendas[0].valor,
    tipo: planoVendas[0].tipo,
  };
  let erroDuplicidade;
  try {
    await conexao.execute(
      "INSERT INTO vendas (id_venda, id_vendedor, id_regiao, data_venda, valor_venda, tipo_cliente, valor_comissao) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [duplicada.id, duplicada.idVendedor, duplicada.idRegiao, dataMes(21), duplicada.valor, duplicada.tipo, 0],
    );
  } catch (error) {
    erroDuplicidade = error;
  }
  verificar(erroDuplicidade?.code === "ER_DUP_ENTRY", "banco rejeita código de venda duplicado (chave primária)");

  const desativacao = await requisitar(`/vendedores/${vendedores[4].id}/desativar`, { method: "PATCH" });
  verificar(desativacao.response.status === 200, "desativação de vendedor preservando seu histórico");
  const vendaInativo = await requisitar("/vendas", {
    method: "POST",
    body: JSON.stringify({ idVendedor: vendedores[4].id, idRegiao: idsRegiao.get("sul"), valorVenda: 50, tipoCliente: "PJ" }),
  });
  verificar(vendaInativo.response.status === 409, "venda para vendedor inativo retorna 409");
  const historicoInativo = await requisitar(`/vendas/vendedor/${vendedores[4].id}`);
  verificar(historicoInativo.response.status === 200 && historicoInativo.body.some((v) => v.id_vendedor === vendedores[4].id), "histórico permanece consultável após desativação");

  const relatorioInvalido = await requisitar("/relatorios/performance?inicio=2026-11-01&fim=2026-10-01");
  verificar(relatorioInvalido.response.status === 400, "período de relatório inválido retorna 400");

  await verificarErroDeConexao();
}

try {
  await executar();
  console.log(`\nJornada concluída: ${aprovados} verificações aprovadas.`);
} catch (error) {
  console.error(`\n❌ Jornada interrompida após ${aprovados} verificações: ${error.message}`);
  process.exitCode = 1;
} finally {
  try {
    await limparDadosDaJornada();
  } catch (error) {
    console.error(`❌ Não foi possível limpar os dados da jornada: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await conexao.end();
  }
}
