// Distribuição embaralhada e reproduzível: cada concurso tem todas as categorias.
const categorias = ['Natural', 'Cereja Descascado', 'Fermentado', 'Outros'];
const porConcurso = Array.from({ length: 3 }, (_, concurso) => {
    const lista = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3];
    let estado = 2026 + concurso * 101;
    for (let i = lista.length - 1; i > 0; i--) {
        estado = (Math.imul(estado, 1664525) + 1013904223) >>> 0;
        const j = Math.floor(estado / 4294967296 * (i + 1));
        [lista[i], lista[j]] = [lista[j], lista[i]];
    }
    return lista.map(indice => categorias[indice]);
});
module.exports = numero => {
    if (!Number.isInteger(numero) || numero < 1 || numero > 48) throw new Error('Amostra demo inválida.');
    return porConcurso[(numero - 1) % 3][Math.floor((numero - 1) / 3)];
};
