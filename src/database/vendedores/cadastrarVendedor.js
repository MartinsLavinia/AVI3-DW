import conexao from "#src/config/db.js";

export default async function cadastrarVendedor(nome, metaMensal, percentualBase) {
  const query = 'INSERT INTO vendedores (nome, meta_mensal, percentual_base) VALUES (?, ?, ?)';

  const [result] = await conexao.execute(query, [nome, metaMensal, percentualBase]);

  return result.insertId;
}