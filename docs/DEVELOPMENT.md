# Guía de Desarrollo, Pruebas y Despliegue - Beneficiate

## 1. Configuración del Entorno de Desarrollo

### 1.1 Requisitos Previos

- **Node.js**: v16.x o superior
- **PostgreSQL**: v14.x o superior
- **Git**: Última versión estable
- **IDE recomendado**: Visual Studio Code con extensiones:
  - ESLint
  - Prettier
  - PostgreSQL
  - REST Client
  - GitLens

### 1.2 Instalación y Configuración

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-organizacion/beneficiate.git
   cd beneficiate
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   
   Crea un archivo `.env` basado en `.env.example`:
   
   ```bash
   cp .env.example .env
   ```
   
   Edita el archivo `.env` con tus configuraciones locales:
   
   ```
   # Configuración del Servidor
   NODE_ENV=development
   PORT=3001
   
   # Configuración de Base de Datos
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=beneficiate
   DB_USER=postgres
   DB_PASS=tucontraseña
   
   # JWT Config
   JWT_SECRET=tu_secreto_jwt_seguro
   JWT_REFRESH_SECRET=tu_refresh_secreto_jwt_seguro
   JWT_VERIFICATION_SECRET=tu_verification_secreto_jwt_seguro
   
   # Wompi Integration
   WOMPI_PUBLIC_KEY=tu_clave_publica_wompi
   WOMPI_PRIVATE_KEY=tu_clave_privada_wompi
   WOMPI_BASE_URL=https://sandbox.wompi.co/v1
   WOMPI_REDIRECT_URL=http://localhost:3000/payment/callback
   
   # Email Config
   EMAIL_USER=tu_email@dominio.com
   EMAIL_PASS=tu_contraseña_email
   EMAIL_WORK_WITH_US=trabajo@dominio.com
   
   # Twilio Config
   TWILIO_ACCOUNT_SID=tu_account_sid
   TWILIO_AUTH_TOKEN=tu_auth_token
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   TWILIO_SMS_NUMBER=+14155238886
   TWILIO_MESSAGING_SERVICE_SID=tu_messaging_service_sid
   ```

4. **Configurar Base de Datos**
   
   Crea una base de datos PostgreSQL:
   
   ```bash
   createdb beneficiate
   ```

   Ejecuta las migraciones para crear la estructura de la base de datos:
   
   ```bash
   npm run migrate
   ```

   (Opcional) Carga datos de prueba:
   
   ```bash
   npm run seed
   ```

5. **Iniciar el servidor en modo desarrollo**
   ```bash
   npm run dev
   ```

## 2. Estructura y Convenciones del Código

### 2.1 Arquitectura del Proyecto

El proyecto sigue una arquitectura modular y orientada a capas:

- **Capa de Presentación**: Controladores (controllers) y Rutas (routes)
- **Capa de Lógica de Negocio**: Servicios (services)
- **Capa de Acceso a Datos**: Repositorios (repositories)
- **Capa de Entidades de Dominio**: Modelos
- **Capa de Infraestructura**: Configuraciones y Middleware

```
📦 src
 ┣ 📂 config          # Configuraciones del sistema
 ┣ 📂 core            # Funcionalidades centrales
 ┣ 📂 middlewares     # Interceptores de solicitudes
 ┣ 📂 modules         # Módulos funcionales
 ┃ ┣ 📂 module1       # Cada módulo sigue el patrón:
 ┃ ┃ ┣ 📜 module1.controller.js  # Controladores
 ┃ ┃ ┣ 📜 module1.repository.js  # Acceso a datos
 ┃ ┃ ┣ 📜 module1.routes.js      # Definición de rutas
 ┃ ┃ ┣ 📜 module1.service.js     # Lógica de negocio
 ┃ ┃ ┗ 📜 module1.validation.js  # Validación de datos
 ┣ 📂 utils           # Utilidades generales
 ┣ 📜 routes.js       # Configuración central de rutas
 ┗ 📜 server.js       # Punto de entrada
```

### 2.2 Convenciones de Código

Seguimos las siguientes convenciones:

- **Nomenclatura**: camelCase para variables, funciones y métodos; PascalCase para clases
- **Asincronía**: Utilizamos Async/Await en lugar de callbacks o promesas directas
- **Gestión de Errores**: Utilizamos try/catch con clases de error personalizadas
- **Estilo de Código**: Configurado con ESLint y Prettier
- **Documentación**: Comentarios JSDoc para funciones públicas

Ejemplo de convención para funciones asíncronas:

```javascript
/**
 * Obtiene un usuario por su ID
 * @param {number} id - ID del usuario
 * @returns {Promise<Object>} - Datos del usuario
 * @throws {NotFoundError} - Si el usuario no existe
 */
const getUserById = async (id) => {
  try {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }
    return user;
  } catch (error) {
    console.error(`Error al obtener usuario (ID: ${id}):`, error);
    throw error;
  }
};
```

### 2.3 Flujo de Trabajo con Git

Utilizamos el modelo de ramas GitFlow:

- **main**: Código en producción
- **develop**: Código en desarrollo
- **feature/nombre-funcionalidad**: Para nuevas funcionalidades
- **bugfix/nombre-bug**: Para correcciones de errores
- **release/v1.x.x**: Para preparación de releases

#### Proceso de Contribución:

1. Crea una nueva rama desde develop:
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/nueva-funcionalidad
   ```

2. Desarrolla tu funcionalidad y haz commits:
   ```bash
   git add .
   git commit -m "feat: Descripción del cambio siguiendo Conventional Commits"
   ```

3. Sube tu rama:
   ```bash
   git push -u origin feature/nueva-funcionalidad
   ```

4. Crea un Pull Request a develop y espera revisión

#### Convenciones de Commit:

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat`: Nueva funcionalidad
- `fix`: Corrección de error
- `docs`: Documentación
- `style`: Cambios de formato
- `refactor`: Refactorización de código
- `test`: Añadir o corregir tests
- `chore`: Tareas de mantenimiento

## 3. Desarrollo y Pruebas

### 3.1 Añadir un Nuevo Módulo

Para crear un nuevo módulo, debes:

1. Crear la estructura de carpetas en `src/modules/nuevo-modulo/`
2. Crear los archivos principales:
   - `nuevo-modulo.controller.js`
   - `nuevo-modulo.repository.js`
   - `nuevo-modulo.routes.js`
   - `nuevo-modulo.service.js`
   - `nuevo-modulo.validation.js`
3. Registrar las rutas en `src/routes.js`

Plantilla para cada archivo:

**nuevo-modulo.routes.js**:
```javascript
const express = require('express');
const router = express.Router();
const controller = require('./nuevo-modulo.controller');
const validate = require('../../middlewares/validate.middleware');
const { validationSchema } = require('./nuevo-modulo.validation');
const authenticate = require('../../middlewares/auth.middleware');

router.get('/all', authenticate, controller.getAll);
router.get('/:id', authenticate, controller.getById);
router.post('/create', authenticate, validate(validationSchema), controller.create);
router.put('/update/:id', authenticate, validate(validationSchema), controller.update);
router.delete('/delete/:id', authenticate, controller.delete);

module.exports = router;
```

**nuevo-modulo.controller.js**:
```javascript
const service = require('./nuevo-modulo.service');
const { successResponse, errorResponse } = require('../../core/responses');

const getAll = async (req, res) => {
  try {
    const items = await service.getAll();
    successResponse(res, items, 'Registros recuperados exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

// Definir otros controladores...

module.exports = {
  getAll,
  // Exportar otros controladores...
};
```

### 3.2 Gestión de Errores

Utilizamos una jerarquía de errores definida en `src/core/errors.js`:

```javascript
// Ejemplo de uso de errores personalizados:
const { ValidationError, NotFoundError } = require('../../core/errors');

const createUser = async (userData) => {
  // Validación de datos
  if (!userData.email) {
    throw new ValidationError('El email es obligatorio');
  }
  
  // Verificación de existencia
  const existingUser = await userRepository.findByEmail(userData.email);
  if (existingUser) {
    throw new ValidationError('El email ya está registrado');
  }
  
  // Operaciones de negocio...
  return userRepository.create(userData);
};
```

## 4. Despliegue

### 4.1 Preparación para Producción

1. **Actualizar Variables de Entorno**:
   Asegúrate de tener configuradas las variables de entorno de producción.

2. **Compilar para Producción**:
   ```bash
   npm run build
   ```

3. **Ejecutar Pruebas**:
   ```bash
   npm test
   ```

4. **Verificar Dependencias**:
   ```bash
   npm ci --only=production
   ```

### 4.2 Despliegue en Google Cloud Platform (GCP)

#### 4.2.1 Preparación de la Instancia GCP

1. **Crear una instancia de VM en GCP**:
   - Accede a la consola de GCP (https://console.cloud.google.com/)
   - Ve a "Compute Engine" > "Instancias de VM"
   - Haz clic en "Crear instancia"
   - Configura según tus necesidades (recomendado: e2-medium o superior para producción)
   - Selecciona Ubuntu 20.04 LTS como sistema operativo
   - Habilita HTTP y HTTPS en las reglas de firewall
   - Crea la instancia

2. **Conectarse a la instancia**:
   ```bash
   gcloud compute ssh nombre-de-tu-instancia --zone=tu-zona
   ```
   o usa el botón "SSH" en la consola GCP

3. **Actualizar el sistema**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

#### 4.2.2 Instalar Dependencias

1. **Instalar Node.js y npm**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt install -y nodejs
   node -v  # Verificar versión (debe ser v16.x o superior)
   npm -v   # Verificar npm
   ```

2. **Instalar PostgreSQL**:
   ```bash
   sudo apt install -y postgresql postgresql-contrib
   sudo systemctl enable postgresql
   sudo systemctl start postgresql
   ```

3. **Instalar Nginx**:
   ```bash
   sudo apt install -y nginx
   sudo systemctl enable nginx
   sudo systemctl start nginx
   ```

4. **Instalar PM2 globalmente**:
   ```bash
   sudo npm install -g pm2
   ```

5. **Instalar Git**:
   ```bash
   sudo apt install -y git
   ```

#### 4.2.3 Configurar PostgreSQL

1. **Configurar usuario y base de datos**:
   ```bash
   sudo -u postgres psql
   ```

   Dentro de PostgreSQL:
   ```sql
   CREATE USER beneficiate WITH PASSWORD 'tu_contraseña_segura';
   CREATE DATABASE beneficiate;
   GRANT ALL PRIVILEGES ON DATABASE beneficiate TO beneficiate;
   \q
   ```

#### 4.2.4 Desplegar la Aplicación

1. **Clonar el repositorio**:
   ```bash
   cd /var/www
   sudo mkdir beneficiate
   sudo chown $USER:$USER beneficiate
   cd beneficiate
   git clone https://github.com/DevCuidame/Beneficiate_Backend.GIT .
   ```

2. **Instalar dependencias de producción**:
   ```bash
   npm ci --only=production
   ```

3. **Configurar variables de entorno**:
   ```bash
   cp .env.example .env
   nano .env
   ```

   Editar el archivo `.env` con la configuración adecuada:
   ```
   NODE_ENV=production
   PORT=3001
   
   # Configuración de Base de Datos
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=beneficiate
   DB_USER=beneficiate
   DB_PASS=tu_contraseña_segura
   
   # JWT y otras configuraciones...
   ```

4. **Ejecutar migraciones de base de datos** (si existen):
   ```bash
   NODE_ENV=production npm run migrate
   ```

5. **Configurar PM2**:
   ```bash
   pm2 start npm --name "beneficiate-api" -- start
   pm2 save
   pm2 startup
   ```
   
   Ejecuta el comando que proporciona el último paso para configurar el inicio automático.

#### 4.2.5 Configurar Nginx como Proxy Inverso

1. **Crear configuración de Nginx**:
   ```bash
   sudo nano /etc/nginx/sites-available/beneficiate
   ```

   Añade el siguiente contenido:
   ```nginx
   server {
       listen 80;
       server_name tu-dominio.com www.tu-dominio.com;  # Reemplaza con tu dominio o IP pública

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       # Configuración específica para WebSockets
       location /socket.io {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

2. **Habilitar el sitio**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/beneficiate /etc/nginx/sites-enabled/
   sudo nginx -t  # Comprobar la configuración
   sudo systemctl restart nginx
   ```

#### 4.2.6 Configurar SSL con Certbot

1. **Instalar Certbot**:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   ```

2. **Obtener certificado SSL**:
   ```bash
   sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
   ```

3. **Verificar la configuración y reiniciar Nginx**:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

#### 4.2.7 Configuración de Firewall GCP

1. **Configurar reglas de firewall en GCP**:
   - Ve a la consola de GCP > VPC Network > Firewall
   - Asegúrate de que los puertos 80 (HTTP) y 443 (HTTPS) estén abiertos
   - Si utilizas WebSockets en otro puerto, asegúrate de abrirlo también

### 4.3 Monitoreo y Logs

#### 4.3.1 Monitoreo con PM2

```bash
# Ver estado
pm2 status

# Ver logs
pm2 logs beneficiate-api

# Monitor en tiempo real
pm2 monit
```

#### 4.3.2 Logs Centralizados

Consideramos usar ELK Stack (Elasticsearch, Logstash, Kibana) para gestión centralizada de logs:

1. Instalar Winston para logging:
   ```bash
   npm install winston winston-elasticsearch
   ```

2. Configurar en `src/utils/logger.js`:
   ```javascript
   const winston = require('winston');
   const { ElasticsearchTransport } = require('winston-elasticsearch');

   const logger = winston.createLogger({
     level: process.env.LOG_LEVEL || 'info',
     format: winston.format.combine(
       winston.format.timestamp(),
       winston.format.json()
     ),
     transports: [
       new winston.transports.Console(),
       new ElasticsearchTransport({
         level: 'info',
         clientOpts: { node: process.env.ELASTICSEARCH_URL },
         indexPrefix: 'beneficiate-logs'
       })
     ]
   });

   module.exports = logger;
   ```

3. Usar en la aplicación:
   ```javascript
   const logger = require('../../utils/logger');
   
   logger.info('Operación completada', { userId: 123, action: 'login' });
   logger.error('Error en procesamiento', { error: err.message, stack: err.stack });
   ```

### 4.4 Mantenimiento y Actualización

1. **Actualizar la aplicación**:
   ```bash
   cd /var/www/beneficiate
   git pull
   npm ci --only=production  # Si hay nuevas dependencias
   pm2 restart beneficiate-api
   ```

2. **Configurar respaldo automático de la base de datos**:
   ```bash
   sudo nano /etc/cron.daily/backup-postgres
   ```

   Añade el siguiente contenido:
   ```bash
   #!/bin/bash
   DATE=$(date +%Y-%m-%d)
   BACKUP_DIR=/var/backups/postgresql
   mkdir -p $BACKUP_DIR
   sudo -u postgres pg_dump beneficiate | gzip > "$BACKUP_DIR/beneficiate-$DATE.sql.gz"
   find $BACKUP_DIR -type f -mtime +7 -delete  # Eliminar backups más antiguos de 7 días
   ```

   Hazlo ejecutable:
   ```bash
   sudo chmod +x /etc/cron.daily/backup-postgres
   ```

## 5. Mejores Prácticas

### 5.1 Seguridad

- **Inyección SQL**: Usamos parámetros en consultas
- **XSS**: Sanitizamos input del usuario
- **CSRF**: Implementamos tokens para formularios
- **Auth**: JWT con expiración, refresh tokens y revocación
- **Rate Limiting**: Limitamos intentos de login
- **HTTPS**: Todo el tráfico por SSL/TLS
- **Secretos**: Nunca en repositorio, siempre en variables de entorno

### 5.2 Rendimiento

- **Índices DB**: Optimizamos consultas frecuentes
- **Caching**: Implementamos caché para datos estáticos
- **Compresión**: gzip para respuestas HTTP
- **Connection Pooling**: Reutilizamos conexiones a BD
- **Paginación**: Limitamos tamaño de respuestas grandes

### 5.3 Documentación

Mantenemos documentación actualizada:

- **README.md**: Información general del proyecto
- **API Docs**: Documentación de endpoints con Swagger
- **JSDoc**: Documentación de código
- **Changelog**: Registro de cambios por versión

## 6. Resolución de Problemas

### 6.1 Problemas Comunes y Soluciones

#### 6.1.1 Conexión a Base de Datos

**Problema**: Error "Connection refused" al iniciar la aplicación

**Solución**:
1. Verifica que PostgreSQL esté ejecutándose: `sudo systemctl status postgresql`
2. Revisa credenciales en `.env`
3. Confirma que la base existe: `psql -U postgres -c "\l"`

#### 6.1.2 WebSockets

**Problema**: Desconexiones frecuentes de WebSockets

**Solución**:
1. Implementa reconexión automática en el cliente
2. Verifica timeouts de Nginx/proxy
3. Aumenta el `pingTimeout` en la configuración de WebSocket

#### 6.1.3 JWT 

**Problema**: "Token inválido" aunque parece correcto

**Solución**:
1. Verifica que JWT_SECRET sea el mismo que se usó para generar el token
2. Comprueba la expiración del token: `jwt.io`
3. Asegúrate que el formato sea correcto: `Bearer <token>`

#### 6.1.4 Problemas con PM2

**Problema**: La aplicación no se inicia o se reinicia constantemente

**Solución**:
1. Verifica los logs de PM2: `pm2 logs beneficiate-api`
2. Intenta reiniciar la aplicación con más información de depuración:
   ```bash
   pm2 delete beneficiate-api
   pm2 start npm --name "beneficiate-api" -- start --no-daemon
   ```
3. Verifica permisos de archivos: `ls -la /var/www/beneficiate`

#### 6.1.5 Problemas con Nginx

**Problema**: Error 502 Bad Gateway

**Solución**:
1. Verifica que la aplicación Node.js esté funcionando: `pm2 status`
2. Comprueba los logs de error de Nginx: `sudo tail -f /var/log/nginx/error.log`
3. Verifica la configuración del proxy: `sudo nginx -t`
4. Asegúrate de que los sockets WebSocket estén correctamente configurados

### 6.2 Depuración

Herramientas para depurar problemas:

```bash
# Ver logs en desarrollo
npm run dev

# Depurar con inspector de Node
node --inspect src/server.js

# Depurar tests específicos
node --inspect node_modules/.bin/jest --runInBand tests/api/users.test.js

# Ver logs en producción
pm2 logs beneficiate-api

# Verificar conectividad de la base de datos
psql -U beneficiate -h localhost -d beneficiate -W

# Verificar puertos en uso
sudo netstat -tulpn | grep LISTEN
```

### 6.3 Lista de Verificación de Despliegue

- [ ] Variables de entorno configuradas correctamente
- [ ] Base de datos creada y migrada
- [ ] PM2 configurado para iniciar con el sistema
- [ ] Nginx configurado como proxy inverso
- [ ] SSL configurado y activo
- [ ] Puertos de firewall abiertos
- [ ] Sistema de backup configurado
- [ ] Monitoreo en funcionamiento
- [ ] Pruebas de la aplicación en entorno de producción
- [ ] Documentación actualizada