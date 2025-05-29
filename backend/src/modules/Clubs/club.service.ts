import {Injectable, NotFoundException} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Club, ClubDocument} from "./club.schema";
import {Model, Types} from "mongoose";
import { ReviewService } from '../Review/review.service';

@Injectable()
export class ClubService {
    constructor(
        @InjectModel(Club.name) private clubModel: Model<ClubDocument>,
        private reviewService: ReviewService
    ) {}

    async create(data: Partial<Club>): Promise<Club> {
        const nuevoClub = new this.clubModel(data)
        return nuevoClub.save()
    }

    async findAll(): Promise<any[]> {
        const clubs = await this.clubModel.find()
            .populate("propietario")
            .populate({
                path: "eventos",
                match: { fecha: { $gte: new Date() } },
                options: { sort: { fecha: 1 } }
            })
            .lean();
        
        const clubsWithMedia = await Promise.all(clubs.map(async (club: any) => {
            let media = 0;
            let total = 0;
            let reviews: any[] = [];
            
            if (club._id) {
                const mediaObj = await this.reviewService.getMediaForClub(club._id.toString());
                media = mediaObj.media;
                total = mediaObj.total;
                
                const reviewModel = this.clubModel.db.model('Review');
                reviews = await reviewModel.find({ 
                    destinoId: club._id,
                    tipoDestino: 'Club'
                })
                .lean();
                
                if (reviews.length > 0) {
                    const reviewIds = reviews.map((r: any) => r._id);
                    await this.clubModel.findByIdAndUpdate(
                        club._id,
                        { $set: { reviews: reviewIds } },
                        { new: false }
                    );
                }
            }
            
            return { 
                ...club, 
                media, 
                total,
                reviews 
            };
        }));
        
        return clubsWithMedia;
    }

    async findById(id: string): Promise<Club> {
        const club = await this.clubModel.findById(id)
            .populate("propietario")
            .exec();
            
        if(!club) {
            throw new NotFoundException("Club no encontrado");
        }
          
        const nombreClub = club?.nombre || 'Desconocido';
        const clubIdStr = club._id.toString();
        
        const reviewModel = this.clubModel.db.model('Review');
        
        const reseñasDirectas = await reviewModel.find({ 
            destinoId: club._id,
            tipoDestino: 'Club'
        })
        .populate({ path: "usuarioUid", model: "Usuario", select: "nombre uid fotoPerfil email" })
        .exec();
        
        let allReviews = reseñasDirectas;
        if (reseñasDirectas.length === 0) {
            const reseñasAlternativas = await reviewModel.find()
                .exec();
            
            const reseñasClub = reseñasAlternativas.filter(r => {
                const destinoIdStr = r.destinoId ? r.destinoId.toString() : '';
                const esTipoClub = r.tipoDestino === 'Club';
                const coincideId = destinoIdStr === clubIdStr;
                return esTipoClub && coincideId;
            });
            
            if (reseñasClub.length > 0) {
                allReviews = reseñasClub;
                
                for (const r of allReviews) {
                    if (r.usuarioUid) {
                        try {
                            const usuario = await this.clubModel.db.model('Usuario').findById(r.usuarioUid).exec();
                            if (usuario) {
                                r.usuarioUid = usuario;
                            }
                        } catch (error) {
                        }
                    }
                }
            }
        }
        
        if (allReviews.length > 0) {
            const reseñasIds = allReviews.map(r => r._id);
            
            await this.clubModel.findByIdAndUpdate(
                club._id,
                { $set: { reviews: reseñasIds } },
                { new: true }
            );
            
            (club as any).reviews = allReviews;
        } else {
            (club as any).reviews = [];
        }
        
        const mediaObj = await this.reviewService.getMediaForClub(club._id.toString());
        (club as any).media = mediaObj.media;
        (club as any).total = mediaObj.total;
        
        const eventos = await this.clubModel.db.model('Evento').find({
            clubId: club._id,
            fecha: { $gte: new Date() }
        })
        .sort({ fecha: 1 })
        .populate({ path: "clubId", select: "nombre ubicacion descripcion" })
        .populate({ path: "djIds", select: "nombre" })
        .exec();
        
        (club as any).eventos = eventos;
        return club;
    }

    async findByUsuarioUid(uid: string): Promise<Club | null> {
        const usuario = await this.clubModel.db.model('Usuario').findOne({ uid });
        if (!usuario) return null;
        return this.clubModel.findOne({ propietario: usuario._id })
            .populate('propietario')
            .populate('eventos')
            .populate('reviews')
            .exec();
    }

    async update(id: string, data: Partial<Club>): Promise<Club> {
        const clubActualizado = await this.clubModel.findByIdAndUpdate(id, data, {new: true}).exec()
        if(!clubActualizado) {
            throw new NotFoundException("Club no encontrado")
        }
        return clubActualizado
    }

    async delete(id: string): Promise<Club> {
        const clubEliminado = await this.clubModel.findByIdAndUpdate(id).exec()
        if(!clubEliminado) {
            throw new NotFoundException("Club no encontrado")
        }
        return clubEliminado
    }

    async getProgresoResenyas(usuarioUid: string) {
        const usuario = await this.clubModel.db.model('Usuario').findOne({ uid: usuarioUid });
        if (!usuario) {
            return { progreso: 0, total: 0, detalles: [], progresosPorRango: {} };
        }
        
        const todasLasReviews = await this.clubModel.db.model('Review').find({});
        if (todasLasReviews.length > 0) {
        }
        
        const reviews = await this.clubModel.db.model('Review').find({ usuarioUid: usuario._id });
        
        if (!reviews || reviews.length === 0) {
            return { progreso: 0, total: 0, detalles: [], progresosPorRango: {} };
        }
        
        const clubIds = reviews
            .filter(r => r.tipoDestino === 'Club')
            .map(r => r.destinoId);
        
        const djIds = reviews
            .filter(r => r.tipoDestino === 'DJ')
            .map(r => r.destinoId);
        
        const [clubs, djs] = await Promise.all([
            this.clubModel.find({ _id: { $in: clubIds } }),
            this.clubModel.db.model('DJ').find({ _id: { $in: djIds } })
        ]);
        
        type Detalle = { 
            destino?: string, 
            tipoDestino: string, 
            rangoPrecios?: string, 
            valor: number,
            eventoId?: string
        };
        
        const detalles: Detalle[] = [];
        
        let progresoTotal = reviews.length;
          
        const progresosPorRango = {
            '$': { 
                progreso: 0, 
                rewards: [
                    { threshold: 10, type: 'consumicion' }, 
                    { threshold: 30, type: 'entrada_gratis' }, 
                    { threshold: 50, type: 'entrada_vip' }, 
                    { threshold: 100, type: 'mesa_vip' }
                ]
            },
            '$$': { 
                progreso: 0,
                rewards: [
                    { threshold: 10, type: 'consumicion' }, 
                    { threshold: 30, type: 'entrada_gratis' }, 
                    { threshold: 50, type: 'entrada_vip' }, 
                    { threshold: 100, type: 'mesa_vip' }
                ]
            },
            '$$$': { 
                progreso: 0, 
                rewards: [
                    { threshold: 10, type: 'consumicion' }, 
                    { threshold: 30, type: 'entrada_gratis' }, 
                    { threshold: 50, type: 'entrada_vip' }, 
                    { threshold: 100, type: 'mesa_vip' }
                ]
            },
            '$$$$': { 
                progreso: 0, 
                rewards: [
                    { threshold: 10, type: 'consumicion' }, 
                    { threshold: 30, type: 'entrada_gratis' }, 
                    { threshold: 50, type: 'entrada_vip' }, 
                    { threshold: 100, type: 'mesa_vip' }
                ]
            }
        };
        
        for (const review of reviews) {
            const reviewInfo = {
                id: review._id.toString(),
                tipoDestino: review.tipoDestino,
                destinoId: review.destinoId?.toString(),
                puntuacion: review.puntuacion,
                eventoId: review.eventoId?.toString()
            };
            
            if (review.tipoDestino === 'Club') {
                const destinoIdStr = typeof review.destinoId === 'string' 
                    ? review.destinoId 
                    : review.destinoId?.toString();
                
                let club: any = undefined;
                
                try {
                    club = clubs.find(c => c._id && typeof c._id.equals === 'function' && c._id.equals(review.destinoId));
                    
                    if (!club) {
                        club = clubs.find(c => c._id && c._id.toString() === destinoIdStr);
                    }
                    
                    if (!club) {
                        club = await this.clubModel.findById(destinoIdStr).exec();
                    }
                } catch (error) {
                }
                
                if (club) {
                    const clubAny = club as any;
                    const nombreClub = clubAny.nombre || 'Club sin nombre';
                    
                    const rangoPrecios = clubAny.rangoPrecios || 
                                      clubAny.priceRangeInitial || 
                                      clubAny.priceRangeCalculated || 
                                      'medio';
                    
                    const rangoPreciosMapped = this.getRangoPreciosMapped(rangoPrecios);
                    
                    if (progresosPorRango[rangoPreciosMapped]) {
                        progresosPorRango[rangoPreciosMapped].progreso += 1;
                    }
                    
                    detalles.push({ 
                        destino: nombreClub, 
                        tipoDestino: 'Club',
                        rangoPrecios: rangoPrecios, 
                        valor: 1,
                        eventoId: review.eventoId?.toString()
                    });
                } else {
                    detalles.push({ 
                        destino: 'Club desconocido', 
                        tipoDestino: 'Club',
                        valor: 1,
                        eventoId: review.eventoId?.toString()
                    });
                }
            } else if (review.tipoDestino === 'DJ') {
                const destinoIdStr = typeof review.destinoId === 'string' 
                    ? review.destinoId 
                    : review.destinoId?.toString();
                
                let dj: any = undefined;
                
                try {
                    dj = djs.find(d => d._id && typeof d._id.equals === 'function' && d._id.equals(review.destinoId));
                    
                    if (!dj) {
                        dj = djs.find(d => d._id && d._id.toString() === destinoIdStr);
                    }
                    
                    if (!dj) {
                        dj = await this.clubModel.db.model('DJ').findById(destinoIdStr).exec();
                    }
                } catch (error) {
                }
                
                if (dj) {
                    const nombreDj = dj?.nombre || 'DJ sin nombre';
                    
                    if (review.eventoId) {
                        try {
                            const evento = await this.clubModel.db.model('Evento').findById(review.eventoId)
                                .populate('clubId')
                                .exec();
                                
                            if (evento && evento.clubId) {
                                const club = evento.clubId as any;
                                const rangoPrecios = club.rangoPrecios || 
                                                  club.priceRangeInitial || 
                                                  club.priceRangeCalculated || 
                                                  '$';
                                                  
                                const rangoPreciosMapped = this.getRangoPreciosMapped(rangoPrecios);
                                
                                if (progresosPorRango[rangoPreciosMapped]) {
                                    progresosPorRango[rangoPreciosMapped].progreso += 1;
                                }
                                
                                detalles.push({ 
                                    destino: nombreDj, 
                                    tipoDestino: 'DJ',
                                    rangoPrecios: rangoPrecios,
                                    valor: 1,
                                    eventoId: review.eventoId?.toString()
                                });
                            } else {
                                detalles.push({ 
                                    destino: nombreDj, 
                                    tipoDestino: 'DJ',
                                    valor: 1,
                                    eventoId: review.eventoId?.toString()
                                });
                            }
                        } catch (error) {
                            detalles.push({ 
                                destino: nombreDj, 
                                tipoDestino: 'DJ',
                                valor: 1,
                                eventoId: review.eventoId?.toString()
                            });
                        }
                    } else {
                        detalles.push({ 
                            destino: nombreDj, 
                            tipoDestino: 'DJ',
                            valor: 1
                        });
                    }
                } else {
                    detalles.push({ 
                        destino: 'DJ desconocido', 
                        tipoDestino: 'DJ',
                        valor: 1,
                        eventoId: review.eventoId?.toString()
                    });
                }
            }
        }
        
        const objetivo = 10;
        
        return { 
            progreso: progresoTotal, 
            total: objetivo, 
            detalles, 
            progresosPorRango 
        };
    }

    private getRangoPreciosMapped(rangoPrecios: string | number): string {
        if (typeof rangoPrecios === 'number') {
            return this.getPriceRangeSymbol(rangoPrecios);
        }
        
        if (!rangoPrecios) {
            return '$';
        }
        
        switch(rangoPrecios.toString().toLowerCase()) {
            case 'bajo':
            case 'económico':
            case '$':
            case '1':
                return '$';
            case 'medio':
            case 'moderado':
            case '$$':
            case '2':
                return '$$';
            case 'alto':
            case 'premium':
            case '$$$':
            case '3':
                return '$$$';
            case 'lujo':
            case 'exclusivo':
            case '$$$$':
            case '4':
                return '$$$$';
            default:
                return '$';
        }
    }
    
    private getPriceRangeSymbol(priceRange: number): string {
        switch(priceRange) {
            case 1: return '$';
            case 2: return '$$';
            case 3: return '$$$';
            case 4: return '$$$$';
            default: return '$';
        }
    }

    async calculateAndUpdatePriceRange(clubId: string): Promise<void> {
        try {
            const club = await this.clubModel.findById(clubId).exec();
            if (!club) {
                throw new NotFoundException(`Club con ID ${clubId} no encontrado`);
            }

            const eventos = await this.clubModel.db.model('Evento').find({
                clubId: club._id,
            }).exec();

            if (!eventos || eventos.length === 0) {
                return;
            }

            let totalPrecios = 0;
            let totalEntradas = 0;

            for (const evento of eventos) {
                if (evento.entradas && Array.isArray(evento.entradas)) {
                    for (const entrada of evento.entradas) {
                        if (entrada.tramos && Array.isArray(entrada.tramos)) {
                            for (const tramo of entrada.tramos) {
                                if (typeof tramo.precio === 'number') {
                                    totalPrecios += tramo.precio;
                                    totalEntradas++;
                                }
                            }
                        }
                    }
                }
            }

            if (totalEntradas === 0) {
                return;
            }

            const averagePrice = totalPrecios / totalEntradas;

            let priceRange = 2;
            if (averagePrice <= 15) {
                priceRange = 1;
            } else if (averagePrice <= 30) {
                priceRange = 2;
            } else if (averagePrice <= 50) {
                priceRange = 3;
            } else {
                priceRange = 4;
            }

            await this.clubModel.findByIdAndUpdate(clubId, {
                priceRangeCalculated: priceRange,
                averageTicketPrice: averagePrice,
                priceRangeVerified: true
            }, { new: true }).exec();
            
        } catch (error) {
        }
    }

    async getClubReviews(clubId: string) {
        try {
            const club = await this.clubModel.findById(clubId);
            if (!club) {
                throw new NotFoundException(`Club con ID ${clubId} no encontrado`);
            }
            
            const reviewModel = this.clubModel.db.model('Review');
            const clubIdObj = Types.ObjectId.createFromHexString(clubId);
            
            const reviews = await reviewModel.find({ 
                destinoId: clubIdObj,
                tipoDestino: 'Club'
            })
            .populate({ 
                path: "usuarioUid", 
                model: "Usuario", 
                select: "nombre uid fotoPerfil email" 
            })
            .populate({
                path: "eventoId",
                model: "Evento",
                select: "nombre fecha"
            })
            .exec();
            
            if (reviews.length > 0) {
                const reviewIds = reviews.map(r => r._id);
                
                await this.clubModel.findByIdAndUpdate(
                    clubId,
                    { $set: { reviews: reviewIds } },
                    { new: true }
                );
            }
            
            const mediaObj = await this.reviewService.getMediaForClub(clubId);
            
            return {
                reviews,
                media: mediaObj.media,
                total: mediaObj.total
            };
            
        } catch (error) {
            throw error;
        }
    }
}