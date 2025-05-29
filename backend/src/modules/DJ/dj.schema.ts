import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {Document, SchemaTypes, Types} from "mongoose";

export type DJDocument = DJ & Document;

export interface DJResponse extends DJ {
    estilosMusicales?: string[];
    gustosMusicales?: string[];
    media?: number;
    total?: number;
    eventos?: any[];
}

@Schema()
export class DJ {
    @Prop({required: true})
    nombre: string;

    @Prop()
    fotoPerfil?: string;

    @Prop({required: true, unique: true})
    email: string;

    @Prop()
    telefono?: string;

    @Prop({type: [String], default: []})
    generos: string[]

    @Prop({ type: Boolean, default: false })
    verificado?: boolean;

    @Prop({ type: String, ref: 'Usuario', required: true })
    usuarioUid: string;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Evento' }], default: [] })
    eventos?: Types.ObjectId[];

    @Prop()
    dni?: string;

    @Prop()
    ubicacion?: string;    @Prop({ required: true, unique: true })
    uid: string;
    
    @Prop({type: [{type: Types.ObjectId, ref:"Review"}], default: []})
    reviews?: Types.ObjectId[]
}

export const DJSchema= SchemaFactory.createForClass(DJ)