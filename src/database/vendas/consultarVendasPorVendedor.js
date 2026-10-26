import conexao from "#src/config/db.js";

export default async function consultarVendasPorVendedor(id) {
  const query = 'SELECT * FROM vendas WHERE id_vendedor = ?';

  try {
    const [result] = await conexao.execute(query, [id]);

    return result;
  } catch (error) {
    console.error('Erro ao consultar vendas do vendedor:', error.message)
    throw error
  }
}