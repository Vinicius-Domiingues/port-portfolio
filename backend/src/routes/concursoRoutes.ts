import { requireAuth, requireAdmin } from '../config/authMiddleware';
import { Router } from 'express';
import db from '../config/database';

const router = Router();
router.use('/concursos', requireAuth, requireAdmin);

// 1. CRIAR NOVO CONCURSO/EVENTO (POST)
router.post('/concursos', async (req, res) => {
    const { nome, ano, status } = req.body;
    try {
        const query = `INSERT INTO concursos (nome, ano, status) VALUES (?, ?, ?)`;
        await db.execute(query, [nome, ano, status || 'Aberto']);
        res.status(201).json({ message: 'Concurso criado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar concurso.' });
    }
});

// 2. LISTAR TODOS OS CONCURSOS (GET)
router.get('/concursos', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM concursos ORDER BY data_criacao DESC');
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar concursos.' });
    }
});

// 3. EDITAR CONCURSO (PUT)
router.put('/concursos/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, ano, status } = req.body;
    try {
        const query = `UPDATE concursos SET nome = ?, ano = ?, status = ? WHERE id = ?`;
        await db.execute(query, [nome, ano, status, id]);
        res.status(200).json({ message: 'Concurso atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar concurso.' });
    }
});

// 4. EXCLUIR CONCURSO (DELETE)
router.delete('/concursos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM concursos WHERE id = ?', [id]);
        res.status(200).json({ message: 'Concurso excluído com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir concurso.' });
    }
});

export default router;
