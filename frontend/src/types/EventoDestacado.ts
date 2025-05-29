export enum EstadoSolicitud {
    PENDIENTE = 'pendiente',
    APROBADA = 'aprobada',
    DENEGADA = 'denegada'
}

export interface EventoDestacado {
    _id?: string;
    eventoId: string;
    clubId: string;
    ciudad: string;
    estado: EstadoSolicitud;
    fechaAprobacion?: string;
    fechaExpiracion?: string;
    activo: boolean;
    createdAt?: string;
    updatedAt?: string;
}
