# Switching Service Frontend

Frontend Vue 3 + Quasar para el servicio de switching de recursos AWS.

## Configuración

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
Copia `.env.example` a `.env` y configura:
- `VITE_COGNITO_USER_POOL_ID`: ID del User Pool de Cognito
- `VITE_COGNITO_USER_POOL_CLIENT_ID`: ID del Client de Cognito
- `VITE_AWS_REGION`: Región de AWS (default: us-east-1)
- `VITE_API_ENDPOINT`: URL base de la API

## Desarrollo

```bash
npm run dev
```

## Build para producción

```bash
npm run build
```

## Despliegue en Amplify

El frontend está configurado para desplegarse en AWS Amplify. Las variables de entorno deben configurarse en la consola de Amplify.
