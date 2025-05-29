# Usa una imagen oficial de Node.js basada en Alpine para un contenedor más ligero
FROM node:20

# Establece el directorio de trabajo en el contenedor
WORKDIR /app

# Copia los archivos de definición de dependencias (package.json y package-lock.json)
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto de los archivos del proyecto al contenedor
COPY . .

# Compila la aplicación (asegúrate de tener un script "build" en package.json que compile TypeScript a JavaScript)
RUN npm run build

# Expone el puerto en el que el backend va a estar escuchando (por defecto 3000 en NestJS)
EXPOSE 3000

# Comando para iniciar la aplicación (ejecuta el archivo compilado)
CMD ["node", "dist/main.js"]
