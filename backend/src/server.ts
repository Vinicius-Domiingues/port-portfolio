import express from 'express';
import cors from 'cors';
import path from 'path'; // <-- Importação nova adicionada aqui
import amostraRoutes from './routes/amostraRoutes';
import concursoRoutes from './routes/concursoRoutes';
import authRoutes from './routes/authRoutes';
import seloRoutes from './routes/seloRoutes';
import produtorRoutes from './routes/produtorRoutes';

const app = express();
const PORT = process.env.PORT || 3002;
 
// Middlewares obrigatórios
app.use(cors());
app.use(express.json());
 
// AQUI: Liberando a pasta "uploads" para o navegador acessar os PDFs fatiados
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
 
// Rotas globais da API
app.use('/api', amostraRoutes);
app.use('/api', concursoRoutes);
app.use('/api', authRoutes);
app.use('/api', seloRoutes);
app.use('/api', produtorRoutes);
 
// Inicialização do Servidor Backend
app.listen(PORT, () => {
    console.log(`SERVIDOR RODANDO EM: http://localhost:${PORT}`);
});
