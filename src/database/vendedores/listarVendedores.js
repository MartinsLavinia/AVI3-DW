import conexao from "#src/config/db.js";

export default async function listarVendedores() {
  const query = 'SELECT * FROM vendedores';

  const [result] = await conexao.execute(query);

  return result;
}