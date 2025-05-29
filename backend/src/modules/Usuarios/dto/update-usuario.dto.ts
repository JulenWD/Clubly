import {IsDateString, IsOptional, IsString} from "class-validator";

export class UpdateUsuarioDto {
    @IsOptional()
    @IsString()
    nombre?: string

    @IsOptional()
    @IsString()
    fotoPerfil?: string

    @IsOptional()
    @IsString({ each: true })
    gustosMusicales?: string[]

    @IsOptional()
    @IsString()
    ubicacion?: string;

    @IsOptional()
    @IsString()
    dni?: string

    @IsOptional()
    @IsDateString()
    fechaNacimiento?: string
}