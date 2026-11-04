import { Router } from 'express';
import db from '../config/database';
import { requireAuth, AuthenticatedRequest } from '../config/authMiddleware';

const router = Router();

// 1. SOLICITAR SELO (POST)
router.post('/selos', requireAuth, async (req: AuthenticatedRequest, res) => {
    const { amostra_id } = req.body;
    const user = req.user;

    if (!user) {
        res.status(401).json({ error: 'Não autorizado.' });
        return;
    }

    if (!amostra_id) {
        res.status(400).json({ error: 'ID da amostra é obrigatório.' });
        return;
    }

    try {
        // Verificar se a amostra existe e qual a nota final
        const [amostras]: any = await db.execute(
            'SELECT nota_final, email FROM amostras WHERE id = ?',
            [amostra_id]
        );

        if (amostras.length === 0) {
            res.status(404).json({ error: 'Amostra não encontrada.' });
            return;
        }

        // Se for produtor, garantir que a amostra pertence a ele
        if (user.role === 'produtor' && amostras[0].email !== user.email) {
            res.status(403).json({ error: 'Você não tem permissão para solicitar selo para esta amostra.' });
            return;
        }

        const nota = parseFloat(amostras[0].nota_final) || 0.00;
        // Permite a solicitação se a nota for 0.00 (lote pendente de avaliação/cadastro) ou se for >= 80.00
        if (nota > 0.00 && nota < 80.00) {
            res.status(400).json({ error: 'Apenas amostras com nota igual ou superior a 80 pontos podem receber selos.' });
            return;
        }

        // Verificar se já existe uma solicitação pendente para esta amostra
        const [existentes]: any = await db.execute(
            'SELECT id FROM solicitacoes_selos WHERE amostra_id = ? AND status = ?',
            [amostra_id, 'Pendente']
        );

        if (existentes.length > 0) {
            res.status(409).json({ error: 'Já existe uma solicitação de selo pendente para esta amostra.' });
            return;
        }

        const query = 'INSERT INTO solicitacoes_selos (amostra_id, status) VALUES (?, ?)';
        await db.execute(query, [amostra_id, 'Pendente']);
        res.status(201).json({ message: 'Solicitação de selo criada com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar solicitação de selo.' });
    }
});

// 2. LISTAR SOLICITAÇÕES DE SELOS (GET)
router.get('/selos', requireAuth, async (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user) {
        res.status(401).json({ error: 'Não autorizado.' });
        return;
    }

    try {
        let query = `
            SELECT 
                ss.id, 
                ss.amostra_id, 
                ss.status, 
                ss.data_solicitacao,
                a.codigo_amostra, 
                a.nome_produtor, 
                a.nome_propriedade, 
                a.municipio, 
                a.cultivar, 
                a.categoria, 
                a.altitude_media, 
                a.altitude_maxima, 
                a.perfil_sensorial, 
                a.nota_final,
                a.arquivo_laudo
            FROM solicitacoes_selos ss
            JOIN amostras a ON ss.amostra_id = a.id
        `;
        const params: any[] = [];

        if (user.role === 'produtor') {
            query += ` WHERE a.email = ?`;
            params.push(user.email);
        }

        query += ` ORDER BY ss.data_solicitacao DESC`;

        const [rows] = await db.execute(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar solicitações de selos.' });
    }
});

// 3. ATUALIZAR STATUS DA SOLICITAÇÃO (PUT)
router.put('/selos/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const statusRecebido = req.body.status;
    const status = statusRecebido === 'Concluída' ? 'Aprovado' : statusRecebido;
    const user = req.user;

    if (!user) {
        res.status(401).json({ error: 'Não autorizado.' });
        return;
    }
    if (user.role === 'produtor') {
        res.status(403).json({ error: 'Apenas organizadores podem atualizar status das solicitações de selo.' });
        return;
    }

    if (!['Pendente', 'Em análise', 'Aprovado', 'Rejeitado'].includes(status)) {
        res.status(400).json({ error: 'Status de solicitação inválido.' });
        return;
    }

    try {
        if (status === 'Aprovado') {
            const [amostras]: any = await db.execute(
                `SELECT a.nota_final FROM amostras a
                 JOIN solicitacoes_selos ss ON ss.amostra_id = a.id
                 WHERE ss.id = ?`,
                [id]
            );

            if (amostras.length === 0) {
                res.status(404).json({ error: 'Amostra associada não encontrada.' });
                return;
            }

            const nota = parseFloat(amostras[0].nota_final) || 0.00;
            if (!Number.isFinite(nota) || nota < 80.00) {
                res.status(400).json({ error: 'Não é possível aprovar esta solicitação. A amostra precisa ter uma nota igual ou superior a 80 pontos.' });
                return;
            }
        }

        const query = 'UPDATE solicitacoes_selos SET status = ? WHERE id = ?';
        const [resultado]: any = await db.execute(query, [status, id]);
        if (!resultado.affectedRows) {
            res.status(404).json({ error: 'Solicitação de selo não encontrada.' });
            return;
        }
        res.status(200).json({ message: 'Status da solicitação atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar status da solicitação.' });
    }
});

// 4. EXCLUIR SOLICITAÇÃO DE SELO (DELETE)
router.delete('/selos/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
        res.status(401).json({ error: 'Não autorizado.' });
        return;
    }

    try {
        if (user.role === 'produtor') {
            const [rows]: any = await db.execute(
                `SELECT ss.id FROM solicitacoes_selos ss 
                 JOIN amostras a ON ss.amostra_id = a.id 
                 WHERE ss.id = ? AND a.email = ?`,
                [id, user.email]
            );
            if (rows.length === 0) {
                res.status(403).json({ error: 'Você não tem permissão para excluir esta solicitação.' });
                return;
            }
        }

        await db.execute('DELETE FROM solicitacoes_selos WHERE id = ?', [id]);
        res.status(200).json({ message: 'Solicitação excluída com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir solicitação de selo.' });
    }
});

export default router;
