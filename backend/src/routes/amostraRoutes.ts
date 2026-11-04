import { Router } from 'express';
import db from '../config/database';
import { CodigoAmostraError, salvarComCodigoUnico } from '../config/codigoAmostra';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../config/authMiddleware';

const router = Router();

import multer from 'multer';
import fs from 'fs';
import path from 'path';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../uploads/laudos');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// ==========================================
// ROTA: CADASTRAR AMOSTRA (TABELA ÚNICA)
// ==========================================
router.post('/amostras', requireAuth, upload.single('arquivo_laudo'), async (req: AuthenticatedRequest, res) => {
    const { 
        concurso_id, codigo_amostra, nome_produtor, municipio, nome_propriedade, categoria, cultivar, 
        altitude_media, altitude_maxima, idade, telefone, email, uso_terra, participa_associacao, 
        coordenadas, assistencia_tecnica, certificacoes, perfil_sensorial, nota_final, genero, quantidade_sacas
    } = req.body;

    const arquivo_laudo = req.file ? req.file.filename : null;

    const user = req.user;
    if (!user) {
        res.status(401).json({ error: 'Não autorizado.' });
        return;
    }

    try {
        let v_concurso = parseInt(concurso_id) || 1;
        const v_codigo = typeof codigo_amostra === 'string' ? codigo_amostra.trim() : '';
        let v_produtor = nome_produtor;
        let v_email = email;
        let v_sensorial = perfil_sensorial;
        let v_nota = parseFloat(nota_final) || 0.00;

        // O produtor agora pode enviar o código da amostra
        if (user.role === 'produtor') {
            v_concurso = 1;
            v_produtor = user.nome;
            v_email = user.email;
        }

        const v_altitude_media = parseInt(altitude_media) || null;
        const v_altitude_maxima = parseInt(altitude_maxima) || null;
        const v_idade = idade ? parseInt(idade) : null;
        const v_quantidade_sacas = quantidade_sacas ? parseInt(quantidade_sacas) : null;

        const query = `INSERT INTO amostras (
            concurso_id, codigo_amostra, nome_produtor, municipio, nome_propriedade, categoria, cultivar, 
            altitude_media, altitude_maxima, idade, telefone, email, uso_terra, participa_associacao, 
            coordenadas, assistencia_tecnica, certificacoes, perfil_sensorial, nota_final, genero, quantidade_sacas, arquivo_laudo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const [result]: any = await salvarComCodigoUnico(v_codigo, undefined, connection => connection.execute(query, [
            v_concurso, v_codigo, v_produtor, municipio, nome_propriedade, categoria, cultivar, 
            v_altitude_media, v_altitude_maxima, v_idade, telefone, v_email, uso_terra, participa_associacao, 
            coordenadas, assistencia_tecnica, certificacoes, v_sensorial, v_nota, genero, v_quantidade_sacas, arquivo_laudo
        ]));
        
        res.status(201).json({ message: 'Amostra cadastrada com sucesso!', id: result.insertId });
    } catch (error) {
        if (error instanceof CodigoAmostraError) {
            if (req.file) await fs.promises.unlink(req.file.path).catch(err => console.error('Erro ao remover laudo rejeitado:', err));
            res.status(error.status).json({ error: error.message });
            return;
        }
        console.error("ERRO NO CADASTRO:", error);
        res.status(500).json({ error: 'Erro ao salvar no banco de dados.' });
    }
});

// ==========================================
// ROTA: EDITAR AMOSTRA (TABELA ÚNICA)
// ==========================================
router.put('/amostras/:id', requireAuth, requireAdmin, upload.single('arquivo_laudo'), async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
        res.status(401).json({ error: 'Não autorizado.' });
        return;
    }
    if (user.role === 'produtor') {
        res.status(403).json({ error: 'Apenas organizadores podem atualizar amostras.' });
        return;
    }

    const { 
        concurso_id, codigo_amostra, nome_produtor, municipio, nome_propriedade, categoria, cultivar, 
        altitude_media, altitude_maxima, idade, telefone, email, uso_terra, coordenadas, 
        assistencia_tecnica, certificacoes, perfil_sensorial, nota_final, genero, quantidade_sacas
    } = req.body;

    const arquivo_laudo = req.file ? req.file.filename : null;

    try {
        const v_concurso = parseInt(concurso_id) || 1;
        const v_codigo = typeof codigo_amostra === 'string' ? codigo_amostra.trim() : '';
        const v_altitude_media = parseInt(altitude_media) || null;
        const v_altitude_maxima = parseInt(altitude_maxima) || null;
        const v_idade = idade ? parseInt(idade) : null;
        const v_quantidade_sacas = quantidade_sacas ? parseInt(quantidade_sacas) : null;
        const v_nota = parseFloat(nota_final) || 0.00;

        let query = `UPDATE amostras SET 
            concurso_id = ?, codigo_amostra = ?, nome_produtor = ?, municipio = ?, nome_propriedade = ?, 
            categoria = ?, cultivar = ?, altitude_media = ?, altitude_maxima = ?, idade = ?, telefone = ?, email = ?, 
            uso_terra = ?, coordenadas = ?, assistencia_tecnica = ?, certificacoes = ?, perfil_sensorial = ?, nota_final = ?, genero = ?, quantidade_sacas = ?`;

        const queryParams = [
            v_concurso, v_codigo, nome_produtor, municipio, nome_propriedade,
            categoria, cultivar, v_altitude_media, v_altitude_maxima, v_idade, telefone, email, 
            uso_terra, coordenadas, assistencia_tecnica, certificacoes, perfil_sensorial, v_nota, genero, v_quantidade_sacas
        ];

        if (arquivo_laudo) {
            query += `, arquivo_laudo = ?`;
            queryParams.push(arquivo_laudo);
        }

        query += ` WHERE id = ?`;
        queryParams.push(id);

        await salvarComCodigoUnico(v_codigo, String(id), connection => connection.execute(query, queryParams));

        res.status(200).json({ message: 'Amostra atualizada com sucesso!' });
    } catch (error) {
        if (error instanceof CodigoAmostraError) {
            if (req.file) await fs.promises.unlink(req.file.path).catch(err => console.error('Erro ao remover laudo rejeitado:', err));
            res.status(error.status).json({ error: error.message });
            return;
        }
        console.error("ERRO NA EDIÇÃO:", error);
        res.status(500).json({ error: 'Erro ao atualizar os dados.' });
    }
});

// ==========================================
// ROTA: BUSCAR AMOSTRAS (TABELA ÚNICA)
// ==========================================
router.get('/amostras', requireAuth, requireAdmin, async (req, res) => {
    const { concurso_id } = req.query;
    try {
        let query = 'SELECT * FROM amostras';
        const params: any[] = [];

        if (concurso_id) {
            query += ' WHERE concurso_id = ?';
            params.push(concurso_id);
        }
        
        query += ' ORDER BY nota_final DESC, data_cadastro DESC';

        const [rows] = await db.execute(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar dados.' });
    }
});

// ==========================================
// ROTA: EXCLUIR AMOSTRA
// ==========================================
router.delete('/amostras/:id', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
        res.status(401).json({ error: 'Não autorizado.' });
        return;
    }
    if (user.role === 'produtor') {
        res.status(403).json({ error: 'Apenas organizadores podem excluir amostras.' });
        return;
    }

    try {
        await db.execute('DELETE FROM amostras WHERE id = ?', [id]);
        res.status(200).json({ message: 'Amostra excluída com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir a amostra.' });
    }
});

export default router;
