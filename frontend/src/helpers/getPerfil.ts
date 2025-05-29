export const getPerfil = () => {
    const perfilStr = localStorage.getItem("perfil")
    return perfilStr ? JSON.parse(perfilStr): null
}