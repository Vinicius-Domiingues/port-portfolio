import { requireAuth, requireAdmin } from '../config/authMiddleware';
import { Router } from 'express';
import db from '../config/database';

const router = Router();
router.use('/produtores', requireAuth, requireAdmin);

// ==========================================
// ROTA: LISTAR PRODUTORES (AGREGADO)
// ==========================================
router.get('/produtores', async (req, res) => {
    try {
        const query = `
            SELECT 
                nome_produtor,
                MAX(email) AS email,
                MAX(telefone) AS telefone,
                MAX(municipio) AS municipio,
                MAX(genero) AS genero,
                MAX(idade) AS idade,
                GROUP_CONCAT(DISTINCT nome_propriedade ORDER BY nome_propriedade SEPARATOR ', ') AS propriedades,
                GROUP_CONCAT(DISTINCT participa_associacao ORDER BY participa_associacao SEPARATOR ', ') AS associacoes,
                GROUP_CONCAT(DISTINCT certificacoes ORDER BY certificacoes SEPARATOR ', ') AS certificacoes,
                GROUP_CONCAT(DISTINCT assistencia_tecnica ORDER BY assistencia_tecnica SEPARATOR ', ') AS assistencias,
                COUNT(DISTINCT NULLIF(TRIM(nome_propriedade), '')) AS total_propriedades,
                GROUP_CONCAT(DISTINCT NULLIF(TRIM(cultivar), '') ORDER BY cultivar SEPARATOR ', ') AS cultivares,
                GROUP_CONCAT(DISTINCT NULLIF(TRIM(municipio), '') ORDER BY municipio SEPARATOR ', ') AS municipios,
                COUNT(id) AS total_amostras,
                AVG(CASE WHEN nota_final > 0 THEN nota_final END) AS media_notas
            FROM amostras
            GROUP BY nome_produtor
            ORDER BY nome_produtor ASC
        `;

        const [rows] = await db.execute(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Erro ao listar produtores:", error);
        res.status(500).json({ error: 'Erro ao buscar produtores.' });
    }
});

// ==========================================
// ROTA: DETALHES DO PRODUTOR POR NOME
// ==========================================
router.get('/produtores/:nome', async (req, res) => {
    const { nome } = req.params;

    try {
        const nomeDecodificado = decodeURIComponent(nome);

        // 1. Obter os dados agregados do produtor
        const queryProdutor = `
            SELECT 
                nome_produtor,
                MAX(email) AS email,
                MAX(telefone) AS telefone,
                MAX(municipio) AS municipio,
                MAX(genero) AS genero,
                MAX(idade) AS idade,
                GROUP_CONCAT(DISTINCT nome_propriedade ORDER BY nome_propriedade SEPARATOR ', ') AS propriedades,
                GROUP_CONCAT(DISTINCT participa_associacao ORDER BY participa_associacao SEPARATOR ', ') AS associacoes,
                GROUP_CONCAT(DISTINCT certificacoes ORDER BY certificacoes SEPARATOR ', ') AS certificacoes,
                GROUP_CONCAT(DISTINCT assistencia_tecnica ORDER BY assistencia_tecnica SEPARATOR ', ') AS assistencias,
                COUNT(DISTINCT NULLIF(TRIM(nome_propriedade), '')) AS total_propriedades,
                GROUP_CONCAT(DISTINCT NULLIF(TRIM(cultivar), '') ORDER BY cultivar SEPARATOR ', ') AS cultivares,
                GROUP_CONCAT(DISTINCT NULLIF(TRIM(municipio), '') ORDER BY municipio SEPARATOR ', ') AS municipios,
                COUNT(id) AS total_amostras,
                AVG(CASE WHEN nota_final > 0 THEN nota_final END) AS media_notas
            FROM amostras
            WHERE nome_produtor = ?
            GROUP BY nome_produtor
        `;

        const [produtores]: any = await db.execute(queryProdutor, [nomeDecodificado]);

        if (produtores.length === 0) {
            res.status(404).json({ error: 'Produtor não encontrado.' });
            return;
        }

        // 2. Obter as amostras do produtor com dados dos concursos
        const queryAmostras = `
            SELECT 
                a.id, 
                a.codigo_amostra, 
                a.nome_propriedade,
                a.categoria, 
                a.cultivar, 
                a.nota_final, 
                c.nome AS nome_concurso,
                c.ano AS ano_concurso
            FROM amostras a
            LEFT JOIN concursos c ON a.concurso_id = c.id
            WHERE a.nome_produtor = ?
            ORDER BY a.nota_final DESC, a.data_cadastro DESC
        `;

        const [amostras] = await db.execute(queryAmostras, [nomeDecodificado]);

        // Reutiliza um cadastro consistente, sem misturar dados de propriedades diferentes.
        const [cadastros]: any = await db.execute(`
            SELECT nome_produtor, email, telefone, genero, idade, nome_propriedade,
                   municipio, altitude_media, altitude_maxima, coordenadas,
                   uso_terra, participa_associacao
            FROM amostras
            WHERE nome_produtor = ?
            ORDER BY data_cadastro DESC, id DESC
            LIMIT 1
        `, [nomeDecodificado]);

        res.status(200).json({
            produtor: produtores[0],
            cadastro: cadastros[0] || null,
            amostras: amostras
        });
    } catch (error) {
        console.error("Erro ao buscar detalhes do produtor:", error);
        res.status(500).json({ error: 'Erro ao buscar detalhes do produtor.' });
    }
});

// ==========================================
// ROTA: EXCLUIR PRODUTOR (E SUAS AMOSTRAS)
// ==========================================
router.delete('/produtores/:nome', async (req, res) => {
    const { nome } = req.params;

    try {
        const nomeDecodificado = decodeURIComponent(nome);

        const query = 'DELETE FROM amostras WHERE nome_produtor = ?';
        const [result]: any = await db.execute(query, [nomeDecodificado]);

        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Produtor não encontrado ou já excluído.' });
            return;
        }

        res.status(200).json({ message: 'Produtor excluído com sucesso!' });
    } catch (error) {
        console.error("Erro ao excluir produtor:", error);
        res.status(500).json({ error: 'Erro ao excluir produtor.' });
    }
});

// ==========================================
// ROTA: ATUALIZAR DADOS DO PRODUTOR
// ==========================================
router.put('/produtores/:nome', async (req, res) => {
    const { nome } = req.params;
    const { 
        novo_nome, 
        email, 
        telefone, 
        municipio, 
        genero, 
        participa_associacao, 
        assistencia_tecnica 
    } = req.body;

    try {
        const nomeDecodificado = decodeURIComponent(nome);

        const query = `
            UPDATE amostras
            SET 
                nome_produtor = COALESCE(?, nome_produtor),
                email = COALESCE(?, email),
                telefone = COALESCE(?, telefone),
                municipio = COALESCE(?, municipio),
                genero = COALESCE(?, genero),
                participa_associacao = COALESCE(?, participa_associacao),
                assistencia_tecnica = COALESCE(?, assistencia_tecnica)
            WHERE nome_produtor = ?
        `;

        const [result]: any = await db.execute(query, [
            novo_nome || null,
            email !== undefined ? email : null,
            telefone !== undefined ? telefone : null,
            municipio !== undefined ? municipio : null,
            genero !== undefined ? genero : null,
            participa_associacao !== undefined ? participa_associacao : null,
            assistencia_tecnica !== undefined ? assistencia_tecnica : null,
            nomeDecodificado
        ]);

        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Produtor não encontrado.' });
            return;
        }

        res.status(200).json({ 
            message: 'Produtor atualizado com sucesso!',
            nome_produtor: novo_nome || nomeDecodificado
        });
    } catch (error) {
        console.error("Erro ao atualizar produtor:", error);
        res.status(500).json({ error: 'Erro ao atualizar produtor.' });
    }
});

export default router;
