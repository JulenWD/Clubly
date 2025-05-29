import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {Evento} from "../Eventos/evento.schema";
import {Rol} from "./roles.enum";
import { Document } from 'mongoose';

export type UsuarioDocument = Usuario & Document;
@Schema()
export class Usuario {
    @Prop({required: true, unique: true})
    uid: string

    @Prop({unique: true, sparse: true})
    dni?: string;

    @Prop()
    fechaNacimiento?: Date;

    @Prop({default: false})
    mayorDeEdad: boolean;

    @Prop({required: true})
    nombre: string;

    @Prop({required: true, unique: true})
    email: string;

    @Prop()
    password?: string

    @Prop()
    fotoPerfil?: string

    @Prop({required: false, default: 'Ubicación no especificada'})
    ubicacion: string;

    @Prop({required: false})
    propietario?: string;

    @Prop()
    gustosMusicales?: string[];

    @Prop()
    biografia?: string

    @Prop({required: true, enum: Rol})
    rol: Rol;

    @Prop({default: false})
    verificado: boolean
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario)

export { Rol };
