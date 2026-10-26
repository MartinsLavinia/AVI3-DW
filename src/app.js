import express from 'express';
import vendasRouter from './routes/vendas.js';
import vendedoresRouter from './routes/vendedores.js';
import relatorioRouter from './routes/relatorio.js';

const app = express();

app.use(express.json()); 
app.use('/vendas', vendasRouter);
app.use('/vendedores', vendedoresRouter);
app.use('/relatorios', relatorioRouter);

export default app;
