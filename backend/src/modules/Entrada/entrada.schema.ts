import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {Document, SchemaTypes, Types} from "mongoose";

export type EntradaDocument = Entrada & Document

@Schema ({ timestamps: true })

export class Entrada {
    @Prop({ type: SchemaTypes.ObjectId, ref: 'Usuario',  required: true })
    usuarioId: Types.ObjectId;

    @Prop ({type: SchemaTypes.ObjectId, ref: 'Evento', required: true})
    eventoId: Types.ObjectId

    @Prop({required: true})
    tipoEntrada: string

    @Prop({required: true})
    precioPagado: number

    @Prop({default: false})
    validada: boolean

    @Prop({default: Date.now})
    fechaCompra: Date

    @Prop({default: false})
    qrCodeUrl: string
}

export const EntradaSchema = SchemaFactory.createForClass(Entrada)