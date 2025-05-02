# ⚙️ Guía de Instalación

Esta guía proporciona instrucciones detalladas para instalar y configurar el proyecto Beneficiate en entornos de desarrollo y producción.

## Requisitos Previos

### Software Necesario
- **Node.js**: v16.x o superior
- **PostgreSQL**: v13.x o superior
- **npm**: v8.x o superior (o yarn)
- **Git**: Para clonar el repositorio

### Recursos de Sistema Recomendados
- **RAM**: Mínimo 2GB
- **Espacio en Disco**: Mínimo 2GB disponibles
- **CPU**: 2 núcleos o más para mejor rendimiento

## Instalación para Desarrollo

### 1. Clonar el Repositorio

```sh
git clone https://github.com/DevCuidame/Beneficiate_Backend.git
cd beneficiate
```

### 2. Instalar Dependencias

```sh
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
# Configuración del Servidor
PORT=3000
NODE_ENV=development

# Configuración de Base de Datos
DB_USER=beneficiate_user
DB_HOST=localhost
DB_NAME=beneficiate_db
DB_PASS=DataPostGF104
DB_PORT=5432

# Tokens JWT
JWT_SECRET=tu_clave_secreta_jwt
JWT_REFRESH_SECRET=tu_clave_secreta_refresh
JWT_VERIFICATION_SECRET=tu_clave_secreta_verificacion

# Configuración Twilio para WhatsApp/SMS
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_WHATSAPP_NUMBER=tu_numero_whatsapp
TWILIO_SMS_NUMBER=tu_numero_sms
TWILIO_MESSAGING_SERVICE_SID=tu_messaging_service_sid

# Configuración de Email
EMAIL_USER=tu_email@beneficiate.co
EMAIL_PASS=tu_password_email
EMAIL_WORK_WITH_US=trabajo@beneficiate.co

# Configuración Wompi (Pagos)
WOMPI_PUBLIC_KEY=tu_clave_publica_wompi
WOMPI_PRIVATE_KEY=tu_clave_privada_wompi
WOMPI_BASE_URL=https://sandbox.wompi.co/v1
WOMPI_REDIRECT_URL=https://beneficiate.co/home-desktop

# URLs
FRONTEND_URL=beneficiate.co
```

### 4. Configurar Base de Datos PostgreSQL

#### 4.1 Crear Usuario y Base de Datos

```sh
# Conectarse a PostgreSQL
sudo -u postgres psql

# Crear usuario
CREATE USER USER_NAME WITH PASSWORD 'PASSWORD';

# Crear base de datos
CREATE DATABASE DATABASE_NAME OWNER USER;

# Salir
\q
```

#### 4.2 Crear Esquema de Base de Datos

Si tienes archivos SQL con la estructura y datos iniciales:

```sh
# Estructura de la base de datos
PGPASSWORD="PASS" psql -U USER -d DB -f /ruta/a/ddl_create.sql

# Datos iniciales
PGPASSWORD="PASS" psql -U USER -d DB -f /ruta/a/dml_data.sql
```

### 5. Crear Directorios para Archivos Subidos

```sh
# Crear directorios necesarios
mkdir -p src/uploads/user
mkdir -p src/uploads/beneficiary
mkdir -p src/uploads/documents

# Establecer permisos
chmod -R 755 src/uploads
```

### 6. Iniciar el Servidor en Modo Desarrollo

```sh
npm run dev
```

El servidor estará disponible en `http://localhost:3000`.

## Configuración para Producción

### 1. Configurar Variables de Entorno para Producción

Crea un archivo `.env` específico para producción:

```env
# Configuración para Producción
NODE_ENV=production
PORT=3000

# Resto de variables...
```

### 2. Configurar PM2 para Gestión de Procesos

Instala PM2 globalmente:

```sh
npm install -g pm2
```

Inicia la aplicación con PM2:

```sh
pm2 start server.js 
```

### 3. Configurar Nginx como Proxy Inverso

Instala Nginx:

```sh
sudo apt-get update
sudo apt-get install nginx
```

Crea un archivo de configuración para el sitio:

```sh
sudo nano /etc/nginx/sites-available/foldername
```

Con el siguiente contenido:

```nginx
server {
    listen 80;
    server_name beneficiate.co www.beneficiate.co;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /uploads/ {
        alias /home/beneficiate/uploads/;
    }

    client_max_body_size 50M;
}
```

Activa el sitio:

```sh
sudo ln -s /etc/nginx/sites-available/beneficiate /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Configurar Directorio de Uploads para Producción

```sh
# Crear directorio de uploads
sudo mkdir -p /home/beneficiate/uploads
sudo mkdir -p /home/beneficiate/uploads/user
sudo mkdir -p /home/beneficiate/uploads/beneficiary
sudo mkdir -p /home/beneficiate/uploads/documents

# Establecer permisos
sudo chmod -R 755 /home/beneficiate/uploads
sudo chown -R usuario:usuario /home/beneficiate/uploads
```

### 5. Configurar SSL con Certbot (Recomendado)

```sh
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d beneficiate.co -d www.beneficiate.co
```

## Verificación de la Instalación

### 1. Verificar Servidor API

```sh
curl http://localhost:3000/api/v1
curl https://api.beneficiate/api/v1
```

Respuesta esperada:
```json
{
  "message": "Server is running",
  "version": "1.0.0"
}
```

### 2. Verificar Conexión a Base de Datos

La aplicación verificará automáticamente la conexión a la base de datos al iniciar. Busca este mensaje en los logs:

```
✅ Database connection successful
```

### 3. Verificar Directorio de Uploads

Intenta subir una imagen a través de la API y verifica que se guarde correctamente en el directorio de uploads configurado.

## Solución de Problemas Comunes

### Error de Conexión a la Base de Datos

**Problema**: El servidor no puede conectarse a PostgreSQL

**Soluciones**:
1. Verifica que PostgreSQL esté en ejecución: `sudo systemctl status postgresql`
2. Revisa las credenciales en el archivo `.env`
3. Asegúrate de que el usuario tiene permisos: `GRANT ALL PRIVILEGES ON DATABASE DB TO USER;`

### Error en Permisos de Directorio de Uploads

**Problema**: No se pueden guardar archivos subidos

**Soluciones**:
1. Verifica permisos: `ls -la /home/beneficiate/uploads`
2. Ajusta permisos y propietario: 
   ```sh
   sudo chmod -R 755 /home/beneficiate/uploads
   sudo chown -R www-data:www-data /home/beneficiate/uploads
   ```