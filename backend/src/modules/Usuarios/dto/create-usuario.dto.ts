import {IsOptional, IsString, IsDateString, IsEnum, IsEmail, ValidateIf, IsNumber, IsBoolean} from 'class-validator';
import { Rol } from '../roles.enum';

export class CreateUsuarioDto {
    @IsString()
    uid: string;

    @IsEmail()
    email: string;

    @IsString()
    nombre: string;

    @IsOptional()
    @IsString()
    fotoPerfil?: string;

    @IsOptional()
    @IsString({ each: true })
    gustosMusicales?: string[];

    @IsOptional()
    @IsString()
    ubicacion?: string;

    @IsEnum(Rol)
    rol: Rol;

    @ValidateIf((o) => o.rol === 'dj' || o.rol === 'propietario')
    @IsString()
    dni: string;

    @ValidateIf((o) => o.rol === 'usuario' || o.rol === 'dj')
    @IsOptional()
    fechaNacimiento?: Date | string | null;
    
    @IsOptional()
    @IsString()
    bio?: string;

    @IsOptional()
    @IsBoolean()
    verificado?: boolean;
    
    @ValidateIf((o) => o.rol === 'propietario')
    @IsOptional()
    @IsNumber()
    priceRangeInitial?: number;
    
    @ValidateIf((o) => o.rol === 'propietario')
    @IsOptional()
    @IsString()
    direccion?: string;
}