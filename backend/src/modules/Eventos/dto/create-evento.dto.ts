import { IsArray, IsDateString, IsMongoId, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class TramoDTO {
    @IsNumber()
    hasta: number;

    @IsNumber()
    precio: number;
}

class EntradaDTO {
    @IsString()
    tipo: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TramoDTO)
    tramos: TramoDTO[];
}

export class CreateEventoDto {
    @IsMongoId()
    clubId: string;

    @IsArray()
    @IsMongoId({ each: true })
    djIds: string[];

    @IsString()
    nombre: string;

    @IsDateString()
    fecha: Date;

    @IsArray()
    @IsString({ each: true })
    generos: string[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EntradaDTO)
    entradas: EntradaDTO[];

    @IsString()
    cartelUrl: string;
}
