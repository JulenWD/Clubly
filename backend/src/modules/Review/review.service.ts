import {Injectable, NotFoundException, BadRequestException} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Review, ReviewDocument} from "./review.schema";
import {Model, Types, isValidObjectId, Document, FlattenMaps} from "mongoose";
import {Entrada} from "../Entrada/entrada.schema";
import {EntradaService} from "../Entrada/entrada.service";

interface EntityWithReviews extends Document {
    _id: Types.ObjectId;
    reviews?: Types.ObjectId[];
    [key: string]: any;
}

type TipoDestino = 'Club' | 'DJ';

interface ReviewCondition {
    usuarioUid?: Types.ObjectId | string;
    destinoId?: Types.ObjectId | string;
    eventoId?: Types.ObjectId | string;
    tipoDestino?: TipoDestino;
}

type EntityModel = Model<any>;

@Injectable()
export class ReviewService {
    constructor(
        @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
        private entradaService: EntradaService
    ) {}
    
    async create(data: Partial<Review>): Promise<ReviewDocument> {
        try {
            if (!data.tipoDestino || !['Club', 'DJ'].includes(data.tipoDestino)) {
                throw new BadRequestException('Invalid or missing tipoDestino');
            }
            let tipoDestinoVal: TipoDestino = data.tipoDestino as TipoDestino;
            
            if (!data.destinoId) {
                throw new BadRequestException('Missing destinoId');
            }
            
            if (!data.usuarioUid) {
                throw new BadRequestException('Missing usuarioUid');
            }
            
            if (!data.eventoId) {
                throw new BadRequestException('Missing eventoId');
            }
            
            try {
                if (typeof data.destinoId === 'string') {
                    data.destinoId = new Types.ObjectId(data.destinoId);
                }
                if (typeof data.usuarioUid === 'string') {
                    data.usuarioUid = new Types.ObjectId(data.usuarioUid);
                }
                if (typeof data.eventoId === 'string') {
                    data.eventoId = new Types.ObjectId(data.eventoId);
                }
            } catch (error) {
                throw new BadRequestException('Uno o más IDs tienen un formato inválido');
            }
            
            if (typeof data.puntuacion !== 'number' || data.puntuacion < 0.5 || data.puntuacion > 5) {
                throw new BadRequestException('Invalid rating: must be a number between 0.5 and 5');
            }
            const entityModel: EntityModel = this.reviewModel.db.model(tipoDestinoVal);
            const destinoIdString = data.destinoId.toString();
            let entityFound = false;
            let entity: EntityWithReviews | null = null;
            try {
                entity = await entityModel.findById(destinoIdString).exec();
                if (entity) {
                        entityFound = true;
                    }
                else {
                    entity = await entityModel.findOne({ 
                        _id: new Types.ObjectId(destinoIdString) 
                    }).exec();
                    
                    if (entity) {
                        entityFound = true;
                    }
                }
            } catch (error) {
            }
            if (!entityFound || !entity) {
                throw new NotFoundException(`${tipoDestinoVal} not found with ID ${destinoIdString}`);
            }
            const existingReview = await this.findByUsuarioYDestinoYEvento(
                data.usuarioUid as Types.ObjectId,
                data.destinoId as Types.ObjectId,
                tipoDestinoVal,
                data.eventoId as Types.ObjectId
            );
            
            if (existingReview) {
                const reviewId = existingReview?.id || (existingReview as any)?._id || 'ID desconocido';
                throw new BadRequestException(`Ya has dejado una review para este ${tipoDestinoVal.toLowerCase()} en este evento`);
            }
            const nuevaReview = new this.reviewModel(data);
            const reviewGuardada = await nuevaReview.save();

            try {
                const entityId = entity._id.toString();
                if (!Array.isArray(entity.reviews)) {
                    await entityModel.findByIdAndUpdate(
                        entityId,
                        { $set: { reviews: [] } },
                        { new: true }
                    ).exec();
                }
                const reviewId = reviewGuardada?.id || (reviewGuardada as any)?._id;
                
                await entityModel.findByIdAndUpdate(
                    entityId,
                    { $addToSet: { reviews: reviewId } },
                    { new: true }
                ).exec();
            } catch (error) {
            }
            
            return reviewGuardada;
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Error creating review');
        }
    }

    private async associateReviewWithEntity(
        entityType: 'Club' | 'DJ',
        entityId: Types.ObjectId | string,
        review: ReviewDocument
    ): Promise<void> {
        try {
            const entityModel: EntityModel = this.reviewModel.db.model(entityType);
            const entityObjectId = new Types.ObjectId(entityId.toString());

            const entity = await entityModel.findOne({ _id: entityObjectId }).exec();
            if (!entity) {
                throw new NotFoundException(`${entityType} not found with ID ${entityId}`);
            }

            const existingReviews = Array.isArray(entity.reviews) ? entity.reviews : [];
            
            await entityModel.updateOne(
                { _id: entityObjectId },
                { 
                    $set: { reviews: existingReviews },
                    $addToSet: { reviews: review?.id || (review as any)?._id } 
                }
            ).exec();
            const reviewId = review?.id || (review as any)?._id || 'unknown-id';
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(`Error associating review with ${entityType}`);
        }
    }

    async findAll(): Promise<ReviewDocument[]> {
        return this.reviewModel
            .find()
            .populate("usuarioId")
            .populate("destinoId")
            .exec();
    }

    async findById(id: string): Promise<ReviewDocument> {
        if (!isValidObjectId(id)) {
            throw new BadRequestException("Invalid review ID");
        }

        const review = await this.reviewModel
            .findById(id)
            .populate("usuarioId")
            .populate("destinoId")
            .exec();

        if (!review) {
            throw new NotFoundException("Review not found");
        }
        return review;
    }
    
    
    async findByUsuarioYDestino(
        usuarioId: Types.ObjectId,
        destinoId: Types.ObjectId,
        tipoDestino: 'Club' | 'DJ'
    ): Promise<ReviewDocument | null> {
        if (!Types.ObjectId.isValid(usuarioId) || !Types.ObjectId.isValid(destinoId)) {
            throw new BadRequestException('Invalid user ID or destination ID');
        }
        return this.reviewModel.findOne({
            usuarioUid: usuarioId,
            destinoId,
            tipoDestino
        }).exec();
    }
    
    async findByUsuarioYDestinoYEvento(
        usuarioId: Types.ObjectId | string,
        destinoId: Types.ObjectId | string,
        tipoDestino: 'Club' | 'DJ',
        eventoId: Types.ObjectId | string
    ): Promise<ReviewDocument | null> {
        try {
            if (!usuarioId || !destinoId || !eventoId) {
                throw new BadRequestException('Missing ID parameters');
            }
            
            const usuarioIdStr = typeof usuarioId === 'string' ? usuarioId : usuarioId.toString();
            const destinoIdStr = typeof destinoId === 'string' ? destinoId : destinoId.toString();
            const eventoIdStr = typeof eventoId === 'string' ? eventoId : eventoId.toString();
            
            let usuarioObjectId: Types.ObjectId | undefined;
            let destinoObjectId: Types.ObjectId | undefined;
            let eventoObjectId: Types.ObjectId | undefined;
            
            try {
                if (Types.ObjectId.isValid(usuarioIdStr)) {
                    usuarioObjectId = new Types.ObjectId(usuarioIdStr);
                }
                
                if (Types.ObjectId.isValid(destinoIdStr)) {
                    destinoObjectId = new Types.ObjectId(destinoIdStr);
                }
                
                if (Types.ObjectId.isValid(eventoIdStr)) {
                    eventoObjectId = new Types.ObjectId(eventoIdStr);
                }
            } catch (error) {
            }
            
            const conditions: ReviewCondition[] = [];
            
            const usuarioConditions: Partial<ReviewCondition>[] = [];
            if (usuarioObjectId) usuarioConditions.push({ usuarioUid: usuarioObjectId });
            if (usuarioIdStr) usuarioConditions.push({ usuarioUid: usuarioIdStr });
            
            const destinoConditions: Partial<ReviewCondition>[] = [];
            if (destinoObjectId) destinoConditions.push({ destinoId: destinoObjectId });
            if (destinoIdStr) destinoConditions.push({ destinoId: destinoIdStr });
            
            const eventoConditions: Partial<ReviewCondition>[] = [];
            if (eventoObjectId) eventoConditions.push({ eventoId: eventoObjectId });
            if (eventoIdStr) eventoConditions.push({ eventoId: eventoIdStr });
            
            for (const uc of usuarioConditions) {
                for (const dc of destinoConditions) {
                    for (const ec of eventoConditions) {
                        conditions.push({
                            ...uc as ReviewCondition,
                            ...dc as ReviewCondition,
                            ...ec as ReviewCondition,
                            tipoDestino
                        } as ReviewCondition);
                    }
                }
            }
            
            if (conditions.length > 0) {
                const review = await this.reviewModel.findOne({
                    $or: conditions
                }).exec();
                
                if (review) {
                    return review;
                }
            }
            
            return null;
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Error al buscar reseñas');
        }
    }
    
    async findByUsuarioUid(usuarioUid: string): Promise<ReviewDocument[]> {
        try {
            let userId: Types.ObjectId | string = usuarioUid;
            
            try {
                if (Types.ObjectId.isValid(usuarioUid)) {
                    userId = new Types.ObjectId(usuarioUid);
                }
            } catch (error) {
            }
            
            const reviews = await this.reviewModel
                .find({ 
                    $or: [
                        { usuarioUid: userId },
                        { usuarioUid: usuarioUid }
                    ] 
                })
                .populate({
                    path: "destinoId",
                    select: "nombre ubicacion rangoPrecio imagen"
                })
                .populate({
                    path: "eventoId",
                    select: "nombre fecha clubId djIds",
                    populate: [
                        { path: "clubId", select: "nombre ubicacion rangoPrecio" },
                        { path: "djIds", select: "nombre imagen" }
                    ]
                })
                .exec();
                
            return reviews;
            
            return reviews;
        } catch (error) {
            return [];
        }
    }

    async update(id: string, data: Partial<Review>): Promise<ReviewDocument> {
        if (!isValidObjectId(id)) {
            throw new BadRequestException("Invalid review ID");
        }

        const updatedReview = await this.reviewModel
            .findByIdAndUpdate(id, data, { new: true })
            .exec();

        if (!updatedReview) {
            throw new NotFoundException("Review not found");
        }

        return updatedReview;
    }

    async delete(id: string): Promise<ReviewDocument> {
        if (!isValidObjectId(id)) {
            throw new BadRequestException("Invalid review ID");
        }

        const deletedReview = await this.reviewModel
            .findByIdAndDelete(id)
            .exec();

        if (!deletedReview) {
            throw new NotFoundException("Review not found");
        }
        return deletedReview;
    }
    async getMediaForDJ(djId: string): Promise<{ media: number; total: number }> {
        try {
            const reviews = await this.reviewModel
                .find({ destinoId: djId, tipoDestino: "DJ" })
                .exec();
                
            if (reviews.length === 0) {
                try {
                    const objectIdReviews = await this.reviewModel
                        .find({ destinoId: new Types.ObjectId(djId), tipoDestino: "DJ" })
                        .exec();
                    
                    if (objectIdReviews.length > 0) {
                        const media = objectIdReviews.reduce((acc, r) => acc + r.puntuacion, 0) / objectIdReviews.length;
                        return { media, total: objectIdReviews.length };
                    }
                } catch (error) {
                }
                
                return { media: 0, total: 0 };
            }

            const media = reviews.reduce((acc, r) => acc + r.puntuacion, 0) / reviews.length;
            return { media, total: reviews.length };
        } catch (error) {
            return { media: 0, total: 0 };
        }
    }
    async getMediaForClub(clubId: string): Promise<{ media: number; total: number }> {
        try {
            const reviews = await this.reviewModel
                .find({ destinoId: clubId, tipoDestino: "Club" })
                .exec();

            if (reviews.length === 0) {
                try {
                    const objectIdReviews = await this.reviewModel
                        .find({ destinoId: new Types.ObjectId(clubId), tipoDestino: "Club" })
                        .exec();
                    
                    if (objectIdReviews.length > 0) {
                        const media = objectIdReviews.reduce((acc, r) => acc + r.puntuacion, 0) / objectIdReviews.length;
                        return { media, total: objectIdReviews.length };
                    }
                } catch (error) {
                }
                
                return { media: 0, total: 0 };
            }

            const media = reviews.reduce((acc, r) => acc + r.puntuacion, 0) / reviews.length;
            return { media, total: reviews.length };
        } catch (error) {
            return { media: 0, total: 0 };
        }
    }
    async rebuildClubReviewAssociations(): Promise<{ success: boolean; message: string }> {
        try {
            const clubReviews = await this.reviewModel
                .find({ tipoDestino: 'Club' })
                .exec();
            
            const clubModel: EntityModel = this.reviewModel.db.model('Club');
            const clubs = await clubModel.find({}).exec();
            
            await Promise.all(clubs.map(club => 
                clubModel.updateOne({ _id: club._id }, { $set: { reviews: [] } }).exec()
            ));
            
            const reviewsByClub = new Map<string, Review[]>();
            
            for (const review of clubReviews) {
                try {
                    const destinoId = review?.destinoId?.toString();
                    const reviewId = review?.id || review?._id;
                    
                    if (!destinoId) {
                        continue;
                    }
                    
                    let club;
                    try {
                        club = await clubModel.findById(destinoId).exec();
                    } catch (err) {
                    }
                    
                    if (!club) {
                        try {
                            club = await clubModel.findOne({ _id: new Types.ObjectId(destinoId) }).exec();
                        } catch (err) {
                        }
                    }
                    
                    if (club) {
                        const clubId = club._id.toString();
                        if (!reviewsByClub.has(clubId)) {
                            reviewsByClub.set(clubId, []);
                        }
                        reviewsByClub.get(clubId)?.push(review);
                    }
                } catch (error) {
                }
            }
            
            let processedCount = 0;
            let errorCount = 0;
            
            for (const [clubId, reviews] of reviewsByClub) {
                try {
                    const reviewIds = reviews.map(r => {
                        const review = r as any;
                        return review?.id || review?._id;
                    });
                    
                    await clubModel.findByIdAndUpdate(
                        clubId,
                        { $set: { reviews: reviewIds } },
                        { new: true }
                    ).exec();
                    processedCount += reviews.length;
                } catch (error) {
                    errorCount++;
                }
            }
            return {
                success: true,
                message: `Successfully processed ${processedCount} reviews with ${errorCount} errors`
            };
        } catch (error) {
            throw new BadRequestException('Error rebuilding club review associations');
        }
    }
}