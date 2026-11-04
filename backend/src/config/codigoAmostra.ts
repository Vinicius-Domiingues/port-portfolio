import db from './database';
import { PoolConnection } from 'mysql2/promise';

export class CodigoAmostraError extends Error {
    constructor(public status: number, mensagem: string) {
        super(mensagem);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

// A mesma trava protege cadastro e edição, inclusive entre instâncias da API.
export async function salvarComCodigoUnico<T>(
    codigo: string,
    idAtual: string | undefined,
    salvar: (connection: PoolConnection) => Promise<T>
): Promise<T> {
    if (!codigo) throw new CodigoAmostraError(400, 'Informe o código completo da amostra.');
    const connection = await db.getConnection();
    let bloqueado = false;
    try {
        const [lock]: any = await connection.execute("SELECT GET_LOCK('port_demo:codigo_amostra', 10) AS adquirido");
        bloqueado = Number(lock[0].adquirido) === 1;
        if (!bloqueado) throw new CodigoAmostraError(503, 'Não foi possível salvar agora. Tente novamente.');
        // Duplicidades antigas não impedem corrigir outros dados do cadastro.
        // A consulta usa a mesma comparação do banco empregada na validação abaixo.
        if (idAtual) {
            const [atuais]: any = await connection.execute(
                'SELECT id FROM amostras WHERE id = ? AND TRIM(codigo_amostra) = ? LIMIT 1',
                [idAtual, codigo]
            );
            if (atuais.length) return await salvar(connection);
        }
        const [repetidos]: any = await connection.execute(
            'SELECT id FROM amostras WHERE TRIM(codigo_amostra) = ?' + (idAtual ? ' AND id <> ?' : '') + ' LIMIT 1',
            idAtual ? [codigo, idAtual] : [codigo]
        );
        if (repetidos.length) {
            throw new CodigoAmostraError(409, 'Já existe uma amostra com esse código completo. Informe um código diferente.');
        }
        return await salvar(connection);
    } finally {
        try {
            if (bloqueado) await connection.execute("SELECT RELEASE_LOCK('port_demo:codigo_amostra')");
        } finally {
            connection.release();
        }
    }
}
