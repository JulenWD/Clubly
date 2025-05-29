import {Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Entrada, EntradaDocument} from "./entrada.schema";
import {Model, Types} from "mongoose";

@Injectable()
export class EntradaService {
    constructor(
        @InjectModel(Entrada.name) private entradaModel: Model<EntradaDocument>
    ) {}

    async crearEntrada(usuarioId: Types.ObjectId, eventoId: Types.ObjectId) {
        return this.entradaModel.create({usuarioId: usuarioId, eventoId: eventoId})
    }

    async usuarioTieneEntrada(usuarioId: Types.ObjectId, eventoId: Types.ObjectId): Promise<boolean> {
        const entrada = await this.entradaModel.findOne({
             usuarioId,
             eventoId
        })
        return !!entrada
    }    async obtenerEntradasDeUsuario(usuarioId: Types.ObjectId): Promise<EntradaDocument[]> {
        return this.entradaModel.find({usuarioId: usuarioId}).populate('eventoId')
    }

    async obtenerUltimaEntradaPorObjectId(usuarioObjectId: string) {
        return this.entradaModel.findOne({ usuarioId: usuarioObjectId })
            .sort({ fechaCompra: -1 })
            .populate({
                path: 'eventoId',
                populate: [
                    { path: 'clubId', select: 'nombre ubicacion descripcion' },
                    { path: 'djIds', select: 'nombre' }
                ]
            })
            .populate('usuarioId')
            .exec();
    }

    async obtenerUltimaEntradaPorUid(uid: string) {
        const usuario = await this.entradaModel.db.model('Usuario').findOne({ uid });
        if (!usuario) return null;
        return this.entradaModel.findOne({ usuarioId: usuario._id })
            .sort({ fechaCompra: -1 })
            .populate({
                path: 'eventoId',
                populate: [
                    { path: 'clubId', select: 'nombre ubicacion descripcion' },
                    { path: 'djIds', select: 'nombre' }
                ]
            })
            .populate('usuarioId')
            .exec();
    }

    async obtenerEntradaPorId(id: string) {
        return this.entradaModel.findById(id)
            .populate({
                path: 'eventoId',
                populate: [
                    { path: 'clubId', select: 'nombre ubicacion descripcion' },
                    { path: 'djIds', select: 'nombre' }
                ]
            })
            .populate('usuarioId')
            .exec();
    }    async obtenerEntradasDeUsuarioPorUid(uid: string): Promise<EntradaDocument[]> {
        const usuario = await this.entradaModel.db.model('Usuario').findOne({ uid });
        if (!usuario) {
            return [];
        }
        
        const entradas = await this.entradaModel.find({ usuarioId: usuario._id })
            .populate({
                path: 'eventoId',
                populate: [
                    { path: 'clubId', select: 'nombre ubicacion descripcion' },
                    { path: 'djIds', select: 'nombre' }
                ]
            })
            .populate('usuarioId')
            .exec();
        
        return entradas;
    }

    async ventasPorEvento(eventoId: string) {
        return this.entradaModel.aggregate([
            { $match: { eventoId: new Types.ObjectId(eventoId) } },
            { $group: { _id: '$tipoEntrada', total: { $sum: 1 } } },
            { $project: { tipoEntrada: '$_id', total: 1, _id: 0 } }
        ]);
    }
}