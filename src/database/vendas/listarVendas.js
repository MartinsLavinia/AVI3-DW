import conexao from "#src/config/db.js";

export default async function listarVendas() {
  const query = 'SELECT * FROM vendas';

  const [result] = await conexao.execute(query);

  return result;
}
