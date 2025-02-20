# Usa una imagen oficial de Node.js (más ligera, basada en Alpine)
FROM node:18-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de package.json y package-lock.json (o yarn.lock)
COPY package.json package-lock.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código de la aplicación
COPY . .

# Construye la aplicación para producción
RUN npm run build

# Instala un servidor ligero para servir la app (por ejemplo, 'serve')
RUN npm install -g serve

# Expone el puerto que vas a usar
EXPOSE 5174

# Comando para iniciar la aplicación
CMD ["serve", "-s", "dist", "-l", "5174"]
