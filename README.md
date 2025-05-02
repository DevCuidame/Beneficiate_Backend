# 🚀 Beneficiate

## 📌 Descripción del Proyecto
Beneficiate es una plataforma integral de servicios de salud que permite a los usuarios gestionar citas médicas, acceder a beneficios de salud y conectarse con profesionales médicos. La aplicación sigue una arquitectura limpia para garantizar modularidad, escalabilidad y mantenibilidad.


## 📂 Estructura de Carpetas

```
📦 beneficiate
 ┣ 📂 src
 ┃ ┣ 📂 config          # Configuración de base de datos, constantes y rutas
 ┃ ┣ 📂 core            # Componentes centrales (errores, validaciones, respuestas)
 ┃ ┣ 📂 middleware      # Middleware de autenticación y validación
 ┃ ┣ 📂 modules         # Módulos funcionales (usuarios, citas, etc.)
 ┃ ┣ 📂 utils           # Utilidades (fecha, JWT, imágenes, etc.)
 ┃ ┣ 📜 routes.js       # Configuración centralizada de rutas
 ┃ ┣ 📜 server.js       # Punto de entrada del servidor
 ┣ 📜 .env              # Variables de entorno
 ┣ 📜 package.json      # Dependencias del proyecto
 ┣ 📜 README.md         # Documentación básica
```

## ⚙️ Instalación Rápida

```sh
# Clonar repositorio
git clone https://github.com/DevCuidame/Beneficiate_Backend
cd Beneficiate_Backend

# Instalar dependencias
npm install

# Configurar .env (ver ./docs/INSTALLATION.md)

# Iniciar 
npm run dev

```

## 📄 Licencia

MIT License © 2025 Opieka SAS