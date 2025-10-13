# Frontend Country Project

## Descripción del Proyecto

Este proyecto es una aplicación frontend desarrollada con React, TypeScript y Vite. Su propósito principal es gestionar y visualizar información relacionada con la administración de caballos, empleados, planes nutricionales, vacunas, y más. Está diseñado para ser utilizado en un entorno administrativo y de gestión.

## Arquitectura del Proyecto

El proyecto sigue una arquitectura modular y organizada de la siguiente manera:

### Estructura de Carpetas

- **public/**: Contiene recursos públicos como imágenes y otros archivos estáticos.
  - `image/`: Carpeta para imágenes específicas del proyecto.

- **src/**: Carpeta principal del código fuente.
  - **assets/**: Archivos estáticos y recursos como íconos o imágenes.
  - **components/**: Componentes reutilizables de la interfaz de usuario (UI).
    - `ui/`: Componentes de UI como botones, formularios, tablas, etc.
  - **pages/**: Páginas principales de la aplicación divididas en:
    - `admin/`: Páginas relacionadas con la administración (empleados, caballos, vacunas, etc.).
    - `user/`: Páginas relacionadas con los usuarios finales.
  - **services/**: Servicios para manejar la lógica de negocio y las llamadas a APIs.
  - **types/**: Definiciones de tipos TypeScript para garantizar un tipado estricto.
  - **utils/**: Funciones auxiliares y utilidades comunes.

- **configuración y otros archivos**:
  - `package.json`: Manejo de dependencias del proyecto.
  - `vite.config.ts`: Configuración de Vite.
  - `tsconfig.json`: Configuración de TypeScript.
  - `tailwind.config.js`: Configuración de Tailwind CSS.

### Tecnologías Principales

- **React**: Biblioteca para construir interfaces de usuario.
- **TypeScript**: Superset de JavaScript que añade tipado estático.
- **Vite**: Herramienta de construcción rápida para proyectos frontend.
- **Tailwind CSS**: Framework de CSS para diseño rápido y responsivo.

## Cómo Hacer el Deploy

Sigue estos pasos para desplegar la aplicación:

### 1. Requisitos Previos

- Node.js instalado (versión 16 o superior).
- Un gestor de paquetes como npm o yarn.

### 2. Instalación de Dependencias

Ejecuta el siguiente comando para instalar las dependencias del proyecto:

```bash
npm install
```

### 3. Configuración de Variables de Entorno

Asegúrate de configurar las variables de entorno necesarias en un archivo `.env` en la raíz del proyecto. Por ejemplo:

```
VITE_API_URL=https://tu-api-url.com
```

### 4. Ejecución en Desarrollo

Para iniciar el servidor de desarrollo, ejecuta:

```bash
npm run dev
```

Esto abrirá la aplicación en tu navegador en `http://localhost:5173`.

### 5. Construcción para Producción

Para generar los archivos optimizados para producción, ejecuta:

```bash
npm run build
```

Los archivos generados estarán en la carpeta `dist/`.

### 6. Despliegue

Sube los archivos de la carpeta `dist/` a tu servidor o plataforma de hosting preferida (por ejemplo, Vercel, Netlify, AWS S3, etc.).

## Contribuciones

Si deseas contribuir a este proyecto, por favor sigue las mejores prácticas de desarrollo y asegúrate de que tu código pase las pruebas existentes.

---

¡Gracias por ser parte de este proyecto!