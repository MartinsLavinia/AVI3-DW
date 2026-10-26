export default function calcularComissao(valorVenda, percentuais = []) {
  const [percentualBase, percentualCliente, percentualRegiao] = percentuais;

  return (
    (valorVenda * (percentualBase + percentualCliente + percentualRegiao)) / 100
  );
}
