# Sistema de Vendas, Comissões e Performance

API REST desenvolvida em Node.js, Express e MySQL para cadastrar vendedores, registrar vendas, calcular comissões e consultar indicadores de desempenho.

## Requisitos

- Node.js 18 ou superior e npm.
- MySQL 8 ou superior.
- Um cliente para executar as requisições HTTP, como Thunder Client, Postman ou Insomnia.

## 1. Obter o projeto e instalar dependências

Na pasta do projeto, execute:

```bash
npm install
```

## 2. Criar e configurar o banco

1. Inicie o servidor MySQL.
2. Na raiz do projeto, copie `.env.example` para um arquivo chamado `.env`.
3. Edite `.env` com os dados da sua instalação do MySQL:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=db_vendas
```

Substitua `sua_senha` pela senha do seu usuário MySQL. Se usar outro host, porta ou usuário, altere os valores correspondentes. O arquivo `.env` contém credenciais locais e não deve ser enviado ao GitHub; o repositório inclui `.env.example` como modelo.

### Criar estrutura e carregar dados demonstrativos

Execute os scripts SQL nesta ordem:

1. `sql/01_schema.sql` cria o banco `db_vendas` e as tabelas `regioes`, `vendedores` e `vendas`, com suas chaves, relacionamentos e restrições.
2. `sql/02_seed.sql` cadastra as quatro regiões e dados demonstrativos: cinco vendedores e quinze vendas distribuídas entre as regiões e entre clientes PF e PJ.

Você pode abrir cada arquivo no MySQL Workbench, conectado ao servidor correto, e executá-lo. Também pode usar o cliente de linha de comando do MySQL:

```bash
mysql -u root -p < sql/01_schema.sql
mysql -u root -p < sql/02_seed.sql
```

Troque `root` pelo usuário configurado, se necessário. O comando pedirá a senha.

> **Atenção:** `01_schema.sql` contém `DROP TABLE IF EXISTS` para recriar as tabelas. Executá-lo novamente apaga os dados existentes nessas tabelas. Use-o na primeira instalação ou quando quiser reinicializar a base. O `02_seed.sql` pode ser executado novamente sem duplicar os dados demonstrativos.

## 3. Iniciar a API

Na raiz do projeto:

```bash
npm run dev
```

Por padrão, a API fica disponível em `http://localhost:3000`. Para usar outra porta, defina `PORT` no ambiente antes de iniciar. Por exemplo, no PowerShell:

```powershell
$env:PORT = "3001"
npm run dev
```

O processo precisa permanecer aberto enquanto você usa a API ou executa o teste de jornada.

## 4. Executar o teste de jornada

Com o MySQL e a API em execução e o `.env` configurado, abra outro terminal na raiz do projeto e rode:

```bash
npm run teste:jornada
```

O teste usa a API para cadastrar cinco vendedores e registrar quinze vendas no mês corrente. Também verifica o cálculo de comissão, a atualização de meta, consultas por vendedor e região, indicadores do relatório, exclusão, entradas inválidas, vendedor inexistente ou inativo, região inexistente, rejeição de código de venda duplicado pelo banco e erro de conexão com o MySQL.

Ao final, o teste apaga somente as vendas e os vendedores que criou, inclusive quando uma verificação falha. Os registros demonstrativos do seed e outros dados anteriores permanecem. O teste de erro de conexão inicia uma instância temporária da API em outra porta, usando uma porta de banco inválida; não é necessário parar o MySQL principal.

O teste consulta as regiões existentes e usa os IDs retornados pelas requisições, portanto não depende de IDs fixos para vendedores ou vendas. Ele espera que a API esteja acessível em `http://localhost:3000`. Para outro endereço, defina `TEST_BASE_URL` antes de rodar. Exemplo no PowerShell:

```powershell
$env:TEST_BASE_URL = "http://localhost:3001"
npm run teste:jornada
```

O seed contém um conjunto persistente de demonstração para consulta pelo professor. A jornada cria outro conjunto temporário pela API e o remove ao terminar.

## 5. Rotas da API

Todas as respostas são JSON. As rotas estão agrupadas por recurso:

| Método | Rota | Operação |
|---|---|---|
| `POST` | `/vendedores` | Cadastrar vendedor |
| `GET` | `/vendedores` | Listar vendedores |
| `GET` | `/vendedores/:id` | Consultar vendedor por código |
| `PUT` | `/vendedores/:id` | Atualizar meta mensal e percentual base |
| `PATCH` | `/vendedores/:id/desativar` | Desativar vendedor sem apagar seu histórico |
| `POST` | `/vendas` | Registrar venda e calcular comissão |
| `GET` | `/vendas` | Listar vendas |
| `GET` | `/vendas/vendedor/:id` | Consultar vendas de um vendedor |
| `GET` | `/vendas/regiao/:id` | Consultar vendas de uma região |
| `DELETE` | `/vendas/:id` | Excluir uma venda existente |
| `GET` | `/relatorios/performance?inicio=AAAA-MM-DD&fim=AAAA-MM-DD` | Consultar relatório do período |

Exemplo de cadastro de vendedor:

```json
{
  "nome": "Ana Lima",
  "metaMensal": 10000,
  "percentualBase": 5
}
```

Exemplo de venda:

```json
{
  "idVendedor": 1,
  "idRegiao": 1,
  "dataVenda": "2026-10-02 10:00:00",
  "valorVenda": 1200,
  "tipoCliente": "PF"
}
```

Os IDs de venda são gerados automaticamente pelo banco. O corpo da requisição não permite escolher o `idVenda`.

### Regras de comissão

Comissão = valor da venda × (percentual base + bônus do cliente + bônus da região) / 100.

- Cliente PF: bônus de 2%; cliente PJ: bônus de 3%.
- Norte: 1%; Nordeste: 1%; Sudeste: 0%; Sul: 0,5%.
- Exemplo: venda de R$ 1.200,00, com base de 5%, cliente PF e região Norte: comissão de R$ 96,00.

### Relatório de performance

O relatório recebe `inicio` e `fim` no formato `AAAA-MM-DD` e apresenta:

- quantidade de vendas;
- soma vendida por região e por tipo de cliente;
- melhor vendedor por valor vendido;
- vendedor com maior comissão acumulada;
- quantidade de vendedores que atingiram a meta no período;
- comissão média geral e média por região.

Para interpretar metas mensais, consulte um intervalo correspondente ao mês de referência, por exemplo `?inicio=2026-10-01&fim=2026-10-31`.

## 6. Teste automatizado e evidências

O único teste automatizado executável do projeto é `teste-jornada.js`, iniciado pelo comando `npm run teste:jornada`. Não há mais uma pasta separada com arquivos de requisição `.http`. A jornada testa os principais fluxos pela API e informa no terminal cada verificação aprovada ou interrompida.

As capturas feitas no Thunder Client estão na pasta `prints/`. Consulte [a documentação das capturas](prints/README.md) para ver o que cada imagem demonstra.

## 7. Organização do projeto

```text
src/
  app.js                         Configuração do Express e rotas
  index.js                       Inicialização do servidor
  config/db.js                   Pool MySQL via mysql2/promise e variáveis .env
  database/                      Operações SQL para vendedores e vendas
  routes/                        Endpoints REST e validações de entrada
  services/                      Cálculo de comissão e relatório de performance
sql/
  01_schema.sql                  Banco, tabelas, chaves e restrições
  02_seed.sql                    Regiões e dados demonstrativos
teste-jornada.js                 Único teste automatizado ponta a ponta
prints/                          Capturas e documentação das evidências
```

## Códigos HTTP usados

- `200`: consulta, atualização, desativação ou exclusão concluída.
- `201`: vendedor ou venda criado.
- `400`: dados de entrada ou intervalo inválidos.
- `404`: registro ou relacionamento solicitado não encontrado.
- `409`: tentativa de registrar venda para vendedor inativo.
- `500`: falha interna, inclusive erro de consulta ou conexão com o banco.
