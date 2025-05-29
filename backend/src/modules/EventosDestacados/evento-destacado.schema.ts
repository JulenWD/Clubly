import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, SchemaTypes, Types } from "mongoose";

export type EventoDestacadoDocument = EventoDestacado & Document;

export enum EstadoSolicitud {
    PENDIENTE = 'pendiente',
    APROBADA = 'aprobada',
    DENEGADA = 'denegada'
}

@Schema({ timestamps: true })
export class EventoDestacado {
    @Prop({ type: Types.ObjectId, ref: 'Evento', required: true })
    eventoId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Club', required: true })
    clubId: Types.ObjectId;

    @Prop({ required: true })
    ciudad: string;

    @Prop({ type: String, enum: Object.values(EstadoSolicitud), default: EstadoSolicitud.PENDIENTE })
    estado: EstadoSolicitud;

    @Prop({ type: Date })
    fechaAprobacion: Date;

    @Prop({ type: Date })
    fechaExpiracion: Date;

    @Prop({ type: Boolean, default: false })
    activo: boolean;
}

export const EventoDestacadoSchema = SchemaFactory.createForClass(EventoDestacado);
