import {Injectable, NotFoundException} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {DJ, DJDocument, DJResponse} from "./dj.schema";
import {Model} from "mongoose";
import { ReviewService } from '../Review/review.service';

@Injectable()
export class DjService {    constructor(
        @InjectModel(DJ.name) private djModel: Model<DJDocument>,
        private reviewService: ReviewService
    ) {}

    async create(data: Partial<DJ>): Promise<DJ> {
        const nuevoDJ = new this.djModel(data);
        return nuevoDJ.save();
    }    async findAll(): Promise<DJResponse[]> {
        const djs = await this.djModel.find({}, { verificado: 1, nombre: 1, email: 1, fotoPerfil: 1, generos: 1, eventos: 1, usuarioUid: 1, uid: 1 })
            .lean();
        
        const djsWithMedia = await Promise.all(djs.map(async (dj) => {
            let media = 0;
            let total = 0;
            if (dj._id) {
                const reviews = await this.reviewService['reviewModel'].find({ destinoId: dj._id, tipoDestino: "DJ" });
                total = reviews.length;
                media = total > 0 ? reviews.reduce((acc, r) => acc + r.puntuacion, 0) / total : 0;
            }
            
            const djWithCompatibleProps: DJResponse = { 
                ...dj, 
                verificado: !!dj.verificado, 
                media, 
                total,
                estilosMusicales: dj.generos || [],
                gustosMusicales: dj.generos || [],
            };
            
            return djWithCompatibleProps;
        }));
        
        return djsWithMedia;
    }async findById(id:string): Promise<DJResponse> {
        const dj = await this.djModel.findById(id).exec();
        if(!dj) {
            throw new NotFoundException("DJ no encontrado")
        }
        
        const eventos = await this.djModel.db.model('Evento').find({
            djIds: dj._id,
            fecha: { $gte: new Date() }
        })
        .sort({ fecha: 1 })
        .populate({ path: "clubId", select: "nombre ubicacion descripcion" })
        .populate({ path: "djIds", select: "nombre" })
        .lean()
        .exec();
        
        const djObject = dj.toObject() as DJResponse;
        djObject.eventos = eventos as any[];
        
        const reviewModel = this.djModel.db.model('Review');
        const reviews: any[] = await reviewModel.find({ 
            destinoId: dj._id,
            tipoDestino: 'DJ'
        })
        .populate({ path: "usuarioUid", model: "Usuario", select: "nombre uid fotoPerfil email" })
        .exec();
        
        if (reviews.length > 0) {
            const reviewIds = reviews.map((r: any) => r._id);
            await this.djModel.findByIdAndUpdate(
                dj._id,
                { $set: { reviews: reviewIds } },
                { new: true }
            );
            
            djObject.reviews = reviews;
        } else {
            djObject.reviews = [];
        }
        
        const mediaObj = await this.reviewService.getMediaForDJ(dj._id.toString());
        djObject.media = mediaObj.media;
        djObject.total = mediaObj.total;
        
        if (dj.generos && dj.generos.length > 0) {
            djObject.estilosMusicales = dj.generos;
            djObject.gustosMusicales = dj.generos;
        } else {
            const usuario = await this.djModel.db.model('Usuario').findOne({ uid: dj.usuarioUid });
            if (usuario && usuario.gustosMusicales && usuario.gustosMusicales.length > 0) {
                dj.generos = usuario.gustosMusicales;
                await dj.save();
                
                djObject.estilosMusicales = usuario.gustosMusicales;
                djObject.gustosMusicales = usuario.gustosMusicales;
            }
        }
        
        return djObject;
    }async findByUid(uid: string): Promise<DJResponse | null> {
        const dj = await this.djModel.findOne({ uid });
        if (!dj) return null;
        
        const usuario = await this.djModel.db.model('Usuario').findOne({ uid });
        
        if (!dj.fotoPerfil && usuario && usuario.fotoPerfil) {
            dj.fotoPerfil = usuario.fotoPerfil;
        }
        
        const djObject: DJResponse = dj.toObject();
        if (usuario && usuario.gustosMusicales && usuario.gustosMusicales.length > 0) {
            if (!dj.generos || dj.generos.length === 0) {
                dj.generos = usuario.gustosMusicales;
                await dj.save();
            }
            
            djObject.estilosMusicales = dj.generos;
            djObject.gustosMusicales = dj.generos;
        } else if (dj.generos && dj.generos.length > 0) {
            djObject.estilosMusicales = dj.generos;
            djObject.gustosMusicales = dj.generos;
        }
        
        await dj.save();
        return djObject;
    }

    async update(id: string, data: Partial<DJ>): Promise<DJ> {
        const djActualizado = await this.djModel.findByIdAndUpdate(id, data, {new: true}).exec()
        if(!djActualizado)  {
            throw new NotFoundException("DJ no encontrado")
        }
        return djActualizado
    }

    async delete(id: string): Promise<DJ> {
        const djEliminado = await this.djModel.findByIdAndDelete(id).exec()
        if(!djEliminado) {
            throw new NotFoundException("DJ no encontrado")
        }
        return djEliminado
    }
}