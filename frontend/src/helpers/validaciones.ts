export function validarDNI(dni: string): boolean {
    const letras = "TRWAGMYFPDXBNJZSQVHLCKE";
    const dniRegex = /^([0-9]{8})([A-Z])$/i;
    const match = dni.toUpperCase().match(dniRegex);
    if (!match) return false;
    const numero = parseInt(match[1], 10);
    const letra = match[2];
    return letras[numero % 23] === letra;
}

export function validarNIF(nif: string): boolean {
    const nifRegex = /^([ABCDEFGHJKLMNPQRSUVW])([0-9]{7})([0-9A-J])$/i;
    const match = nif.toUpperCase().match(nifRegex);
    if (!match) return false;
    return true;
}