import conexao from "#src/config/db.js";

export default async function atualizarVendedor(id, metaMensal, percentualBase) {
  const query = "UPDATE vendedores SET meta_mensal = ?, percentual_base = ? WHERE id_vendedor = ?";

  try {
    const [result] = await conexao.execute(query, [metaMensal, percentualBase, id]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error.message);

    throw error;
  }
}
