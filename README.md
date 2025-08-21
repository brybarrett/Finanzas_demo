# Sistema de Finanzas Personales

Aplicación web para gestión de finanzas personales desarrollada con Next.js y Node.js.

## Características

- 💰 Gestión de cuentas bancarias
- 📊 Registro de transacciones (ingresos, gastos, transferencias)
- 🏷️ Categorización automática de transacciones
- 📈 Dashboard con estadísticas financieras
- 🔐 Sistema de autenticación seguro
- 💱 Soporte para múltiples monedas (peso chileno por defecto)
- 🏆 Sistema de puntuación y ranking de usuarios

## Estructura del Proyecto

```
Front_End/
├── back/                    # Servidor backend (Node.js + Express)
│   ├── .env                # Variables de entorno
│   ├── database.sqlite     # Base de datos SQLite
│   ├── server.js          # Punto de entrada del servidor
│   └── src/               # Código fuente del backend
│       ├── controllers/   # Controladores de la aplicación
│       ├── middleware/    # Middleware de autenticación
│       ├── models/        # Modelos de base de datos
│       ├── routes/        # Rutas de la API
│       └── utils/         # Utilidades (monedas, etc.)
├── front/                 # Aplicación frontend (Next.js + React)
│   ├── .env.local        # Variables de entorno del frontend
│   ├── package.json      # Dependencias del frontend
│   └── src/              # Código fuente del frontend
│       ├── app/          # Páginas de la aplicación
│       ├── components/   # Componentes reutilizables
│       ├── contexts/     # Contextos de React
│       ├── config/       # Configuración de API
│       └── types/        # Tipos de TypeScript
└── .vscode/              # Configuración de VS Code
    └── tasks.json        # Tareas para ejecutar servidores
```

## Tecnologías Utilizadas

### Backend
- **Node.js** - Entorno de ejecución
- **Express.js** - Framework web
- **SQLite** - Base de datos
- **JWT** - Autenticación
- **bcryptjs** - Encriptación de contraseñas
- **express-rate-limit** - Limitación de solicitudes

### Frontend
- **Next.js 15** - Framework de React
- **React** - Biblioteca de interfaz de usuario
- **TypeScript** - Lenguaje tipado
- **Tailwind CSS** - Framework de estilos
- **Axios** - Cliente HTTP

## Instalación y Configuración

### Prerrequisitos
- Node.js (versión 18 o superior)
- npm o yarn

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd Front_End
```

### 2. Instalar dependencias

**Backend:**
```bash
cd back
npm install
```

**Frontend:**
```bash
cd ../front
npm install
```

### 3. Configurar variables de entorno

El archivo `.env` del backend ya está configurado con valores por defecto:
- Puerto del backend: 3001
- Base de datos: SQLite local
- Frontend URL: http://localhost:3000

## Ejecutar la Aplicación

### Opción 1: Usando el script de inicio
```bash
# Desde la raíz del proyecto
start.bat
```

### Opción 2: Ejecutar manualmente

**Terminal 1 - Backend:**
```bash
cd back
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd front
npm run dev
```

### Acceder a la aplicación
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api

## Detener la Aplicación

- Presiona `Ctrl + C` en ambas terminales
- O cierra las ventanas de terminal

## Base de Datos

La aplicación utiliza SQLite con las siguientes tablas:
- `users` - Usuarios del sistema
- `accounts` - Cuentas bancarias
- `transactions` - Transacciones financieras  
- `categories` - Categorías de transacciones

La base de datos se crea automáticamente al iniciar el servidor backend por primera vez.

## Credenciales de Prueba

Para probar la aplicación, puedes registrarte o usar:
- **Email:** josuzamoranoi@gmail.com
- **Contraseña:** 123456

## Funcionalidades Principales

1. **Autenticación:** Registro e inicio de sesión seguro
2. **Dashboard:** Vista general de finanzas con estadísticas
3. **Cuentas:** Crear y gestionar cuentas bancarias
4. **Transacciones:** Registrar ingresos, gastos y transferencias
5. **Categorías:** Sistema automático de categorización
6. **Estadísticas:** Gráficos y resúmenes financieros
7. **Ranking:** Sistema de puntuación competitivo

## Desarrollo

El proyecto está configurado con:
- **Hot reload** en ambos servidores
- **TypeScript** para tipado estático
- **ESLint** para linting de código
- **Tailwind CSS** para estilos responsivos

