import {Prop, Schema, SchemaFactory,} from "@nestjs/mongoose";
import {SchemaTypes, Types} from "mongoose";

export type ClubDocument = Club & Document;

@Schema( {timestamps: true})
export class Club {
    @Prop({type: SchemaTypes.ObjectId, ref: 'Usuario', required: true})
    propietario: Types.ObjectId

    @Prop({required: true})
    nombre: string

    @Prop()
    telefono?: string;

    @Prop({required: true})
    ubicacion: string

    @Prop()
    direccion: string

    @Prop()
    descripcion: string

    @Prop({type: [String]})
    estilosMusicales?: string[]

    @Prop({type: [{type: Types.ObjectId, ref:"Evento"}]})
    eventos?: Types.ObjectId[]

    @Prop({type: [{type: Types.ObjectId, ref:"Review"}]})
    reviews?: Types.ObjectId[]

    @Prop({type: [String]})
    redesSociales: string[]
    
    @Prop()
    capacidad: number
    
    @Prop({
        type: Number,
        enum: [1, 2, 3, 4],
        default: 2,
        description: 'Rango de precios inicial definido por el propietario: 1 (€), 2 (€€), 3 (€€€), 4 (€€€€)'
    })
    priceRangeInitial?: number;

    @Prop({
        type: Number,
        enum: [1, 2, 3, 4],
        description: 'Rango de precios calculado automáticamente: 1 (€), 2 (€€), 3 (€€€), 4 (€€€€)'
    })
    priceRangeCalculated?: number;

    @Prop({
        type: Boolean,
        default: false,
        description: 'Indica si el rango de precios ha sido verificado mediante cálculos automáticos'
    })
    priceRangeVerified?: boolean;

    @Prop({
        type: Number,
        description: 'Precio medio de las entradas calculado automáticamente'
    })
    averageTicketPrice?: number;

    @Prop({
        type: String,
        enum: ['bajo', 'medio', 'alto'],
        required: true,
        default: 'medio',
        description: 'Rango de precios estimado: bajo ($), medio ($$), alto ($$$)'
    })
    rangoPrecios: string;    @Prop()
    fotoPerfil?: string;
    
    @Prop({
        type: Boolean,
        default: false,
        description: 'Indica si el club ha sido verificado por los administradores'
    })
    verificado: boolean;
}
export const ClubSchema = SchemaFactory.createForClass(Club)