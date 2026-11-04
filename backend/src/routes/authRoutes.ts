import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../config/authMiddleware';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'port_demo_local_secret_change_for_deployment';

// REGISTRO DE NOVO USUÁRIO
router.post('/auth/registro', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    const nome = typeof req.body.nome === 'string' ? req.body.nome.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const senha = req.body.senha;

    if (!nome || nome.length > 150 || email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof senha !== 'string' || senha.length < 8 || Buffer.byteLength(senha, 'utf8') > 72) {
        res.status(400).json({ error: 'Informe nome, e-mail válido e senha com pelo menos 8 caracteres (máximo de 72 bytes).' });
        return;
    }

    try {
        // Verificar se e-mail já está em uso
        const [rows]: any = await db.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (rows.length > 0) {
            res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
            return;
        }

        const senhaHash = await bcrypt.hash(senha, 10);
        await db.execute(
            'INSERT INTO usuarios (nome, email, senha, role) VALUES (?, ?, ?, ?)',
            [nome, email, senhaHash, 'produtor']
        );

        res.status(201).json({ message: 'Usuário criado com sucesso!' });
    } catch (error) {
        if ((error as any).code === 'ER_DUP_ENTRY') {
            res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
            return;
        }
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar usuário.' });
    }
});

router.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    res.json({ usuario: req.user });
});

router.get('/usuarios', requireAuth, requireAdmin, async (_req, res) => {
    try {
        const [usuarios] = await db.execute('SELECT id, nome, email, role, criado_em FROM usuarios ORDER BY nome, id');
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar usuários.' });
    }
});

router.patch('/usuarios/:id/administrador', requireAuth, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
        res.status(400).json({ error: 'Usuário inválido.' });
        return;
    }
    try {
        const [usuarios]: any = await db.execute('SELECT id FROM usuarios WHERE id = ?', [id]);
        if (!usuarios.length) {
            res.status(404).json({ error: 'Usuário não encontrado.' });
            return;
        }
        await db.execute('UPDATE usuarios SET role = ? WHERE id = ?', ['organizador', id]);
        res.json({ message: 'Administrador adicionado com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar permissão.' });
    }
});

// LOGIN
router.post('/auth/login', async (req: Request, res: Response) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
        return;
    }

    try {
        const [rows]: any = await db.execute('SELECT * FROM usuarios WHERE email = ?', [email]);

        if (rows.length === 0) {
            res.status(401).json({ error: 'E-mail ou senha incorretos.' });
            return;
        }

        const usuario = rows[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if (!senhaValida) {
            res.status(401).json({ error: 'E-mail ou senha incorretos.' });
            return;
        }

        const token = jwt.sign(
            { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role },
            JWT_SECRET,
            { expiresIn: '8h' }
        );
 
        res.status(200).json({
            message: 'Login realizado com sucesso!',
            token,
            usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao realizar login.' });
    }
});

export default router;
