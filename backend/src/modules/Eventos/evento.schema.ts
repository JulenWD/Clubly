import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import { SchemaTypes, Types} from "mongoose";

export type EventoDocument = Evento & Document;

@Schema()
export class Evento {
    @Prop({type: SchemaTypes.ObjectId, ref: 'Club', required: true})
    clubId: Types.ObjectId

    @Prop({type: [{type: SchemaTypes.ObjectId, ref: 'DJ', required: true}]})
    djIds: Types.ObjectId[]

    @Prop({required: true})
    nombre: string

    @Prop({required: true})
    fecha: Date

    @Prop([{
        tipo: { type: String, required: true },
        tramos: [
            {
                hasta: { type: Number, required: true },
                precio: { type: Number, required: true }
            }
        ]
    }])
    entradas: {
        tipo: string;
        tramos: {
            hasta: number;
            precio: number;
        }[];
    }[]

    @Prop({type: [{type: SchemaTypes.ObjectId, ref: 'Usuario'}] })
    asistentes: Types.ObjectId[]

    @Prop({ type: [String], default: [] })
    generos: string[];

    @Prop({ required: true })
    cartelUrl: string;
}

export const EventoSchema = SchemaFactory.createForClass(Evento)