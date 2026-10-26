import conexao from "#src/config/db.js";

export default async function desativarVendedor(id) {
  const query = "UPDATE vendedores SET ativo = false WHERE id_vendedor = ?";

  try {
    const [result] = await conexao.execute(query, [id]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error("Erro ao desativar usuário:", error.message);

    throw error;
  }
}
