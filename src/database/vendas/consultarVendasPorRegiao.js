import conexao from "#src/config/db.js";

export default async function consultarVendasPorRegiao(id) {
  const query = 'SELECT * FROM vendas WHERE id_regiao = ?';

  const [result] = await conexao.execute(query, [id]);

  return result;
}