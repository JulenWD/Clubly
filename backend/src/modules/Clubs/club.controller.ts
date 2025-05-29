import {Body, Controller, Delete, Get, Param, Post, Put} from "@nestjs/common";
import {ClubService} from "./club.service";
import {Club} from "./club.schema";

@Controller("clubs")
export class ClubController {
    constructor(private readonly clubService: ClubService) {
    }

    @Get()
    async findAll(): Promise<Club[]> {
        return this.clubService.findAll();
    }

    @Get(":id")
    async findById(@Param("id") id: string): Promise<Club> {
        return this.clubService.findById(id)
    }

    @Get("/usuario/:uid")
    async findByUsuarioUid(@Param("uid") uid: string): Promise<Club | null> {
        return this.clubService.findByUsuarioUid(uid);
    }

    @Get('progreso-resenyas/:usuarioUid')
    async getProgresoResenyas(@Param('usuarioUid') usuarioUid: string) {
        return this.clubService.getProgresoResenyas(usuarioUid);
    }

    @Get(":id/reviews")
    async getClubReviews(@Param("id") id: string) {
        return this.clubService.getClubReviews(id);
    }

    @Put(":id")
    async update(@Param("id") id: string, @Body() data: Partial<Club>): Promise<Club> {
        return this.clubService.update(id, data)
    }

    @Delete(":id")
    async delete(@Param("id") id: string): Promise<Club> {
        return this.clubService.delete(id)
    }

    @Post(":id/calculate-price-range")
    async calculatePriceRange(@Param("id") id: string) {
        await this.clubService.calculateAndUpdatePriceRange(id);
        return { success: true, message: "Rango de precios actualizado correctamente" };
    }

    @Post("calculate-all-price-ranges")
    async calculateAllPriceRanges() {
        const clubs = await this.clubService.findAll();
        for (const club of clubs) {
            await this.clubService.calculateAndUpdatePriceRange(club._id.toString());
        }
        return { 
            success: true, 
            message: `Rangos de precios actualizados para ${clubs.length} clubs` 
        };
    }
}