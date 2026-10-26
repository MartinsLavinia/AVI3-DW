import conexao from "#src/config/db.js";

export default async function excluirVenda(id) {
  const query = 'DELETE FROM vendas WHERE id_venda = ?';

  const [result] = await conexao.execute(query, [id]);

  return result.affectedRows > 0;
}