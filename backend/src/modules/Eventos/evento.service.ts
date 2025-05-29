import {Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Evento, EventoDocument} from "./evento.schema";
import {Model, Types} from "mongoose";
import {CreateEventoDto} from "./dto/create-evento.dto";
import { Entrada } from "../Entrada/entrada.schema";
import { ReviewService } from '../Review/review.service';

@Injectable()
export class EventoService{
    constructor(
        @InjectModel(Evento.name) private eventoModel: Model<EventoDocument>,
        private reviewService: ReviewService
    ) {}

    async create(data: CreateEventoDto): Promise<Evento> {        if (data.fecha && typeof data.fecha === 'string') {
            data.fecha = new Date(data.fecha);
        }
        let djIds: string[] = [];
        if ((data as any).djIds && Array.isArray((data as any).djIds)) {
            djIds = (data as any).djIds;
        }
        const nuevoEvento = new this.eventoModel({ ...data, djIds });
        const eventoGuardado = await nuevoEvento.save();
        if (eventoGuardado.clubId) {
            const clubModel = this.eventoModel.db.model('Club');
            let eventoId = eventoGuardado._id;
            if (!(eventoId instanceof Types.ObjectId)) {
                eventoId = new Types.ObjectId(eventoId);
            }
            await clubModel.findByIdAndUpdate(
                eventoGuardado.clubId,
                { $addToSet: { eventos: eventoId } },
                { new: true }
            );
        }        if (djIds.length > 0) {
            const djModel = this.eventoModel.db.model('DJ');
            for (const djId of djIds) {
                await djModel.findByIdAndUpdate(
                    djId,
                    { $addToSet: { eventos: eventoGuardado._id } },
                    { new: true }
                );
            }
        }
        return eventoGuardado;
    }

    async findAll(): Promise<any[]> {
        const eventos = await this.eventoModel.find().populate('clubId').populate('djIds').lean();
        const eventosConMedia = await Promise.all(eventos.map(async (evento) => {
            let clubMedia = 0;
            let clubTotal = 0;
            if (evento.clubId && evento.clubId._id) {
                const mediaObj = await this.reviewService.getMediaForClub(evento.clubId._id.toString());
                clubMedia = mediaObj.media;
                clubTotal = mediaObj.total;
            }
            return { ...evento, clubMedia, clubTotal };
        }));        eventosConMedia.sort((a, b) => b.clubMedia - a.clubMedia);
        return eventosConMedia;
    }

    async findById(id: string): Promise<Evento | null> {
        const evento = await this.eventoModel.findById(id).populate('clubId').populate('djIds').lean();
        if (!evento) return null;
        const ventas = await this.eventoModel.db.model('Entrada').aggregate([
            { $match: { eventoId: evento._id } },
            { $group: { _id: "$tipoEntrada", total: { $sum: 1 } } }
        ]);
        (evento as any).ventasPorTipo = {};
        ventas.forEach((v: any) => {
            (evento as any).ventasPorTipo[v._id] = v.total;
        });
        return evento;
    }

    async findByClubId(clubId: string): Promise<Evento[]> {
        return this.eventoModel.find({ clubId }).populate('clubId').populate('djIds').exec();
    }

    async findByDjId(djId: string): Promise<Evento[]> {
        return this.eventoModel.find({ djIds: djId }).populate('clubId').populate('djIds').exec();
    }

    async update(id: string, data: Partial<Evento>): Promise<Evento | null>{
        return this.eventoModel.findByIdAndUpdate(id, data, {new: true}).exec()
    }

    async delete(id: string): Promise<Evento | null> {
        return this.eventoModel.findByIdAndDelete(id).exec();
    }

    async actualizarEntradas(id: string, entradas: any[]) {
        return this.eventoModel.findByIdAndUpdate(
            id,
            { entradas },
            { new: true }
        );
    }
}