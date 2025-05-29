import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {Document, SchemaTypes, Types} from "mongoose";

export interface ReviewDocument extends Review, Document {
    _id: Types.ObjectId;
    id?: string;
}
@Schema()
 export class Review {

 @Prop({ type: SchemaTypes.ObjectId, ref: 'Usuario', required: true })
 usuarioUid: Types.ObjectId

 @Prop({type: Types.ObjectId, refPath:"tipoDestino", required: true})
 destinoId: Types.ObjectId;

 @Prop({required: true, enum: ["Club", "DJ"]})
 tipoDestino: string;

 @Prop({ required: true , min: 0.5, max: 5 })
 puntuacion: number

 @Prop()
 comentario: string

 @Prop({ type: SchemaTypes.ObjectId, ref: 'Evento', required: true })
 eventoId: Types.ObjectId;

}

export const ReviewSchema = SchemaFactory.createForClass(Review)