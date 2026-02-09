# Switching Service - Frontend

Frontend Vue 3 + Vite para el Switching Service. Autenticación con AWS Cognito.

## Requisitos

- Node.js 18+
- npm 9+

## Instalación

```bash
npm install
```

## Variables de entorno

Copia `.env.example` a `.env` y configura:

- `VITE_AWS_REGION` - Región AWS (ej: us-east-1)
- `VITE_COGNITO_USER_POOL_ID` - ID del User Pool de Cognito
- `VITE_COGNITO_USER_POOL_CLIENT_ID` - ID del Client de Cognito
- `VITE_API_ENDPOINT` - URL base de la API (sin /api)

## Desarrollo

```bash
npm run dev
```

## Build

```bash
npm run build
```

La salida se genera en `dist/`.
