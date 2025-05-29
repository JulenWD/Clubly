import {ConflictException, Injectable, InternalServerErrorException, NotFoundException} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Usuario, UsuarioDocument} from "./usuario.schema";
import {Model} from "mongoose";
import {CreateUsuarioDto} from "./dto/create-usuario.dto";
import {Club, ClubDocument} from "../Clubs/club.schema";
import {DJ, DJDocument} from "../DJ/dj.schema";

@Injectable()
export class UsuarioService {
    constructor(
        @InjectModel(Usuario.name) private usuarioModel: Model<UsuarioDocument>,
        @InjectModel(Club.name) private clubModel: Model<ClubDocument>,
        @InjectModel(DJ.name) private djModel: Model<DJDocument>
        ) {}

    async create(data: Partial<Usuario>): Promise<UsuarioDocument> {
        try {            
            const nuevoUsuario = new this.usuarioModel(data);
            const usuarioGuardado = await nuevoUsuario.save();

            if (usuarioGuardado.rol === 'dj') {
                const djExistente = await this.djModel.findOne({ uid: usuarioGuardado.uid });
                if (!djExistente) {
                    await this.djModel.create({
                        uid: usuarioGuardado.uid,
                        usuarioUid: usuarioGuardado.uid,
                        nombre: usuarioGuardado.nombre,
                        fotoPerfil: usuarioGuardado.fotoPerfil || '',
                        generos: usuarioGuardado.gustosMusicales || [],
                        bio: '',
                        verificado: usuarioGuardado.verificado || false,
                        email: usuarioGuardado.email,
                    });
                }
            }
            return usuarioGuardado;
        } catch (err: any) {            
            console.error('Error al crear usuario:', err);
            if (err.code === 11000) {
                const usuarioExistente = await this.usuarioModel.findOne({
                    $or: [{ uid: data.uid }, { email: data.email }]
                });
                if (usuarioExistente) {
                    return usuarioExistente;
                } else {
                    throw new InternalServerErrorException('Error inesperado: no se encontró el usuario después de un conflicto.');
                }
            }
            throw err;
        }
    }    

    async findAll(): Promise<Usuario[]> {
        return this.usuarioModel.find().exec();
    }

    async findByUid(uid: string): Promise<UsuarioDocument | null> {
        return this.usuarioModel.findOne({ uid }).exec();
    }

    async updateByUid(uid: string, data: Partial<Usuario>): Promise<Usuario | null> {
        return this.usuarioModel.findOneAndUpdate({ uid }, data, { new: true });
    }

    async verificar(id: string): Promise<Usuario> {
        const usuario = await this.usuarioModel.findByIdAndUpdate(
            id,
            {verificado: true},
            {new: true}
        )
        if (!usuario) {
            throw new NotFoundException('Usuario no encontrado')
        }
        return usuario
    }    

    async setVerificado(id: string, verificado: boolean): Promise<Usuario> {
        const usuario = await this.usuarioModel.findByIdAndUpdate(
            id,
            { verificado },
            { new: true }
        );        
        if (!usuario) {
            throw new NotFoundException('Usuario no encontrado');
        }
        
        if (usuario.rol === 'dj' && usuario.uid) {
            const dj = await this.djModel.findOneAndUpdate(
                { uid: usuario.uid },
                { verificado },
                { new: true }
            );            
        }
        if (usuario.rol === 'propietario' && usuario.uid) {
            try {
                const usuarioModel = await this.usuarioModel.findOne({ uid: usuario.uid });
                if (usuarioModel && usuarioModel._id) {
                    const club = await this.clubModel.findOne({ propietario: usuarioModel._id });
                    if (club) {
                        await this.clubModel.findByIdAndUpdate(
                            club._id,
                            { verificado },
                            { new: true }
                        );
                    }
                }
            } catch (error) {
                console.error('Error al verificar club:', error);
            }
        }
        return usuario;
    }

    async delete(id: string): Promise<Usuario> {
        const usuarioEliminado = await this.usuarioModel.findByIdAndDelete(id).exec();
        if(!usuarioEliminado) {
            throw new NotFoundException("Usuario no encontrado")
        }
        return usuarioEliminado
    }

    async syncClubWithUsuario(usuario: UsuarioDocument, data: Partial<Usuario>) {
        if (usuario.rol !== 'propietario') return;
        let club = await this.clubModel.findOne({ propietario: (usuario as any)._id });
        if (!club) {
            club = await this.clubModel.create({
                propietario: (usuario as any)._id,
                nombre: data.nombre || usuario.nombre + ' Club',
                ubicacion: usuario.ubicacion || 'Ubicación no especificada',
                descripcion: (data as any).descripcion || '',
                estilosMusicales: usuario.gustosMusicales || [],
                eventos: [],
                reviews: [],
                redesSociales: [],
                capacidad: 0,
                fotoPerfil: data.fotoPerfil || usuario.fotoPerfil || '',
            });
        } else {
            const clubUpdate: any = {};
            if (data.fotoPerfil) clubUpdate.fotoPerfil = data.fotoPerfil;
            if (data.nombre) clubUpdate.nombre = data.nombre;
            if ((data as any).descripcion) clubUpdate.descripcion = (data as any).descripcion;
            await this.clubModel.findByIdAndUpdate(club._id, clubUpdate);
        }
    }
}