import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from './database';

const JWT_SECRET = process.env.JWT_SECRET || 'port_demo_local_secret_change_for_deployment';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        nome: string;
        email: string;
        role: string;
    };
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Token de autenticação não fornecido ou inválido.' });
        return;
    }

    const token = authHeader.split(' ')[1];

    let decoded: any;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
        if (!Number.isInteger(decoded.id)) throw new Error('Invalid subject');
    } catch (err) {
        res.status(401).json({ error: 'Token inválido ou expirado.' });
        return;
    }
    try {
        const [rows]: any = await db.execute('SELECT id, nome, email, role FROM usuarios WHERE id = ?', [decoded.id]);
        if (!rows.length || !['organizador', 'produtor'].includes(rows[0].role)) {
            res.status(401).json({ error: 'Conta indisponível ou sem permissão de acesso.' });
            return;
        }
        req.user = rows[0];
        next();
    } catch (err) {
        res.status(503).json({ error: 'Não foi possível verificar o acesso. Tente novamente.' });
    }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (req.user?.role !== 'organizador') {
        res.status(403).json({ error: 'Acesso permitido apenas para administradores.' });
        return;
    }
    next();
}
