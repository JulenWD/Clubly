import {Body, Controller, Delete, Get, Param, Post, Put, UseGuards, Req} from "@nestjs/common";
import {DjService} from "./dj.service";
import {DJ} from "./dj.schema";
import { AuthGuard } from '../../auth/auth.guard';

@Controller("djs")
export class DjController {
    constructor(private readonly djService: DjService) {
    }

    @Get('mi-perfil')
    @UseGuards(AuthGuard)
    async getMiPerfil(@Req() req) {
        return this.djService.findByUid(req.user.uid);
    }

    @Get()
    async findAll(): Promise<DJ[]> {
        return this.djService.findAll()
    }

    @Get(":id")
    async findById(@Param("id")id: string): Promise<DJ> {
        return this.djService.findById(id)
    }

    @Put(":id")
    async update(@Param("id")id: string, @Body() data: Partial<DJ>): Promise<DJ> {
        return this.djService.update(id,data)
    }

    @Delete(":id")
    async delete(@Param("id")id: string): Promise<DJ> {
        return this.djService.delete(id)
    }
}