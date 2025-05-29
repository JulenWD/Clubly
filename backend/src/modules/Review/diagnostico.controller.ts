import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ClubService } from '../Clubs/club.service';
import { DjService } from '../DJ/dj.service';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Review } from './review.schema';
import { Club } from '../Clubs/club.schema';
import { DJ } from '../DJ/dj.schema';

@Controller('diagnostico')
export class DiagnosticoController {  constructor(
    private reviewService: ReviewService,
    private clubService: ClubService,
    private djService: DjService,
    @InjectModel(Review.name) private reviewModel: Model<Review>,
    @InjectModel(Club.name) private clubModel: Model<Club>,
    @InjectModel(DJ.name) private djModel: Model<DJ>
  ) {}

  @Get('review/:id')
  async examinarReview(@Param('id') id: string) {
    try {
      const review = await this.reviewModel.findById(id).lean();
      if (!review) {
        return { error: 'Reseña no encontrada' };
      }

      const destinoIdStr = review.destinoId ? review.destinoId.toString() : 'no-id';
      const tipoDestino = review.tipoDestino;
      let destino = null;

      if (tipoDestino === 'Club') {
        try {
          destino = await this.clubService['clubModel'].findById(destinoIdStr).lean();
        } catch (err) {
          console.error('Error buscando club:', err);
        }
      } else if (tipoDestino === 'DJ') {
        try {
          destino = await this.djService['djModel'].findById(destinoIdStr).lean();
        } catch (err) {
          console.error('Error buscando DJ:', err);
        }
      }      
      let estaAsociada = false;
      if (destino && (destino as any).reviews) {
        const reviewIdStr = review._id.toString();
        estaAsociada = (destino as any).reviews.some((r: any) => r && r.toString() === reviewIdStr);
      }

      return {
        review,
        destinoIdStr,
        tipoDestino,
        destinoEncontrado: !!destino,
        nombreDestino: destino ? (destino as any).nombre : 'No encontrado',
        destinoTieneArrayReviews: destino && Array.isArray((destino as any).reviews),
        cantidadReviewsEnDestino: destino && Array.isArray((destino as any).reviews) ? (destino as any).reviews.length : 0,
        reseñaAsociadaConDestino: estaAsociada
      };
    } catch (error) {
      return { error: error.message, stack: error.stack };
    }
  }
  @Get('club/:id/reviews')
  async diagnosticoClub(@Param('id') clubId: string) {
    try {
      const club = await this.clubModel.findById(clubId).lean();
      if (!club) {
        return { error: 'Club no encontrado' };
      }

      const reviewsParaClub = await this.reviewModel.find({
        tipoDestino: 'Club',
        destinoId: Types.ObjectId.createFromHexString(clubId)
      }).lean();

      const reviewIdsAsociados = (club.reviews || []).map(r => r.toString());      
      const reviewsConDetalles = reviewsParaClub.map(review => {
        const reviewId = review._id.toString();
        return {
          reviewId,
          puntuacion: review.puntuacion,
          comentario: review.comentario ? review.comentario.substring(0, 50) : 'Sin comentario',
          estaAsociadaConClub: reviewIdsAsociados.includes(reviewId)
        };
      });

      return {
        clubId,
        nombreClub: (club as any).nombre,
        tieneArrayReviews: Array.isArray((club as any).reviews),
        reviewsAsociadasSegunClub: ((club as any).reviews || []).length,
        reviewsEncontradas: reviewsParaClub.length,
        reviewsAsociadasCorrectamente: reviewsConDetalles.filter(r => r.estaAsociadaConClub).length,
        reviewsNoAsociadas: reviewsConDetalles.filter(r => !r.estaAsociadaConClub).length,
        detalleReviews: reviewsConDetalles,
      };
    } catch (error) {
      return { error: error.message, stack: error.stack };
    }
  }

  @Get('todas-reviews')
  async todasLasReviews() {
    try {
      const todasReviews = await this.reviewModel.find().lean();
      
      const reviewsClub = todasReviews.filter(r => r.tipoDestino === 'Club');
      const reviewsDj = todasReviews.filter(r => r.tipoDestino === 'DJ');

      const clubIdsUnicos = [...new Set(reviewsClub.map(r => r.destinoId.toString()))];
      const djIdsUnicos = [...new Set(reviewsDj.map(r => r.destinoId.toString()))];

      return {
        totalReviews: todasReviews.length,
        totalReviewsClub: reviewsClub.length,
        totalReviewsDj: reviewsDj.length,
        clubesConReviews: clubIdsUnicos.length,
        djsConReviews: djIdsUnicos.length,
        resumenReviews: todasReviews.map(r => ({
          id: r._id.toString(),
          tipoDestino: r.tipoDestino,
          destinoId: r.destinoId.toString(),
          puntuacion: r.puntuacion
        }))
      };
    } catch (error) {
      return { error: error.message, stack: error.stack };
    }
  }
  @Post('reparar-club-reviews')
  async repararClubReviews(@Body() { clubId }: { clubId: string }) {
    try {
      if (!clubId) {
        return { error: 'Se requiere un clubId' };
      }

      const club = await this.clubModel.findById(clubId);
      if (!club) {
        return { error: 'Club no encontrado' };
      }

      const reviewsParaClub = await this.reviewModel.find({
        tipoDestino: 'Club',
        destinoId: Types.ObjectId.createFromHexString(clubId)
      });      
      const reviewIds = reviewsParaClub.map((r: any) => r._id);
      await this.clubModel.findByIdAndUpdate(
        clubId,
        { $set: { reviews: reviewIds } },
        { new: true }
      );

      return {
        success: true,
        mensaje: `Club actualizado con ${reviewIds.length} reseñas`,
        reviewIds: reviewIds.map(id => id.toString())
      };
    } catch (error) {
      return { error: error.message, stack: error.stack };
    }
  }
}
