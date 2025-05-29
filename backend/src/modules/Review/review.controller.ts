import {ReviewService} from "./review.service";
import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    Param,
    Post,
    Put,
    Req,
    UseGuards
} from "@nestjs/common";
import {Review, ReviewDocument} from "./review.schema";
import { AuthGuard } from "../../auth/auth.guard";
import { VerificadoGuard } from "../../auth/verificado.guard";
import { RolesGuard } from "../../auth/roles.guard";
import {Roles} from "../../decorators/roles.decorators";
import {UsuarioService} from "../Usuarios/usuario.service";
import { UsuarioDocument } from "../Usuarios/usuario.schema";
import { Types } from 'mongoose';

@UseGuards(AuthGuard)
@Controller("reviews")
export class ReviewController {
    constructor(
        private readonly reviewService: ReviewService,
        private readonly usuarioService: UsuarioService) {
    }    @Roles("usuario")
    @UseGuards(AuthGuard, VerificadoGuard)
    @Post()
    async create(@Body() data: Partial<Review>): Promise<Review> {
        try {
            const {usuarioUid, destinoId, tipoDestino, comentario, puntuacion, eventoId} = data;
            if(!usuarioUid || !destinoId || !tipoDestino || !puntuacion || !eventoId) {
                throw new BadRequestException("usuarioUid, destinoId, tipoDestino, eventoId y puntuacion son obligatorios");
            }
              if (tipoDestino !== 'Club' && tipoDestino !== 'DJ') {
                throw new BadRequestException('El tipo de destino debe ser "Club" o "DJ"');            }            const usuario = await this.usuarioService.findByUid(String(usuarioUid)) as UsuarioDocument;
            if (!usuario) {
                throw new BadRequestException("Usuario no encontrado");
            }
            let destinoObjectId: Types.ObjectId;
            let eventoObjectId: Types.ObjectId;
              try {
                if (typeof destinoId === 'string') {
                    destinoObjectId = new Types.ObjectId(destinoId);
                } else if (destinoId instanceof Types.ObjectId) {
                    destinoObjectId = destinoId;                } else if (destinoId && typeof destinoId === 'object' && (destinoId as any)._id) {
                    const id = (destinoId as any)._id;
                    destinoObjectId = typeof id === 'string' ? 
                        new Types.ObjectId(id) : id;                } else {
                    throw new Error('Formato de destinoId inválido');
                }
                
                if (typeof eventoId === 'string') {
                    eventoObjectId = new Types.ObjectId(eventoId);
                } else if (eventoId instanceof Types.ObjectId) {
                    eventoObjectId = eventoId;                } else if (eventoId && typeof eventoId === 'object' && (eventoId as any)._id) {
                    const id = (eventoId as any)._id;
                    eventoObjectId = typeof id === 'string' ? 
                        new Types.ObjectId(id) : id;                } else {
                    throw new Error('Formato de eventoId inválido');
                }
            } catch (error) {
                throw new BadRequestException(`IDs inválidos: ${error.message}`);            }
            const existeReview = await this.reviewService.findByUsuarioYDestinoYEvento(
                usuario['_id'],
                destinoObjectId,
                tipoDestino,
                eventoObjectId
            );
              if(existeReview) {                throw new BadRequestException(`Ya has dejado una review para este ${tipoDestino.toLowerCase()} en este evento`);
            }
            
            const nuevaReview = await this.reviewService.create({
                usuarioUid: usuario['_id'],
                destinoId: destinoObjectId,
                tipoDestino,
                comentario,
                puntuacion,
                eventoId: eventoObjectId
            });
              return nuevaReview;        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(`Error al crear la reseña: ${error.message}`);
        }
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles("admin")
    @Get()
    async findAll(): Promise<Review[]> {
        return this.reviewService.findAll()
    }

    @UseGuards(AuthGuard)
    @Get('mis-resenyas')
    async getMisResenyas(@Req() req) {
        const usuarioUid = req.user.uid;
        return this.reviewService.findByUsuarioUid(usuarioUid);
    }

    @Get(":id")
    async findById(@Param("id") id:string): Promise<Review> {
        return this.reviewService.findById(id)
    }

    @UseGuards(AuthGuard)
    @Put(":id")
    async update(@Param("id") id:string, @Body() data: Partial<Review>, @Req() req):Promise<Review> {
        const review = await this.reviewService.findById(id)
        if(!review) throw new ForbiddenException("Review no encontrada")

        if (review.usuarioUid !== req.user.uid) {
            throw new ForbiddenException("No puedes editar esta review")
        }

        return this.reviewService.update(id, data)
    }

    @UseGuards(AuthGuard)
    @Delete(":id")
    async delete(@Param("id")id: string, @Req() req): Promise<Review> {
        const review = await this.reviewService.findById(id)
        if(!review) throw new ForbiddenException("Review no encontrada")

        if(review.usuarioUid !== req.user.uid) {
            throw new ForbiddenException("No puedes eliminar esta review")
        }
        return this.reviewService.delete(id)
    }

    @Get('dj/:uid/media')
    async getMediaDJ(@Param('uid') uid: string) {
        return this.reviewService.getMediaForDJ(uid);
    }

    @Get('club/:clubId/media')
    async getMediaClub(@Param('clubId') clubId: string) {
        return this.reviewService.getMediaForClub(clubId);
    }    @UseGuards(AuthGuard, RolesGuard)
    @Roles("admin")
    @Post('rebuild-club-associations')
    async rebuildClubReviewAssociations() {
        return this.reviewService.rebuildClubReviewAssociations();
    }
      @Get('verify-club-reviews/:clubId')
    async verifyClubReviews(@Param('clubId') clubId: string) {
        const reviews = await this.reviewService['reviewModel']
            .find({ destinoId: clubId, tipoDestino: "Club" })
            .exec();
        
        if (reviews.length > 0) {
            const clubModel = this.reviewService['reviewModel'].db.model('Club');
            const club = await clubModel.findById(clubId).exec();
              if (club) {
                await clubModel.findByIdAndUpdate(
                    clubId,
                    { $set: { reviews: reviews.map(r => r.id || (r as any)._id) } },
                    { new: true }
                ).exec();
                
                return { 
                    success: true, 
                    message: `Se han asociado ${reviews.length} reseñas al club correctamente` 
                };
            } else {
                return { 
                    success: false, 
                    message: 'No se encontró el club con el ID proporcionado' 
                };
            }
        } else {
            return { 
                success: true, 
                message: 'No hay reseñas para asociar a este club' 
            };
        }
    }
}