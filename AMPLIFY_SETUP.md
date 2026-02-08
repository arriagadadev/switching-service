# Configuración de Amplify para Switching Service Frontend

Este documento describe cómo configurar el frontend en AWS Amplify con autenticación Cognito.

## Prerrequisitos

1. Tener un User Pool de Cognito creado
2. Tener un App Client de Cognito configurado
3. Tener la API desplegada y funcionando

## Pasos de Configuración

### 1. Crear el User Pool de Cognito (si no existe)

```bash
aws cognito-idp create-user-pool \
  --pool-name switching-service-users \
  --auto-verified-attributes email \
  --policies PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=false}
```

Anota el `Id` del User Pool creado.

### 2. Crear el App Client

```bash
aws cognito-idp create-user-pool-client \
  --user-pool-id <USER_POOL_ID> \
  --client-name switching-service-client \
  --generate-secret \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH
```

Anota el `ClientId` del App Client creado.

### 3. Configurar el Authorizer en API Gateway

El authorizer de Cognito se crea automáticamente cuando despliegas el servicio con Serverless Framework. Asegúrate de tener la variable de entorno `COGNITO_USER_POOL_ID` configurada antes de desplegar:

```bash
export COGNITO_USER_POOL_ID=<USER_POOL_ID>
npm run deploy:dev  # o deploy:qa, deploy:prod según el stage
```

### 4. Configurar Amplify

1. Conecta tu repositorio de GitHub a Amplify
2. En la configuración de la app de Amplify, ve a "Environment variables"
3. Agrega las siguientes variables de entorno:

```
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=<USER_POOL_ID>
VITE_COGNITO_USER_POOL_CLIENT_ID=<CLIENT_ID>
VITE_API_ENDPOINT=https://<api-id>.execute-api.<region>.amazonaws.com/<stage>
```

**Nota:** Reemplaza:
- `<USER_POOL_ID>` con el ID del User Pool de Cognito
- `<CLIENT_ID>` con el Client ID de Cognito
- `<api-id>`, `<region>`, `<stage>` con los valores de tu API Gateway

### 5. Configurar el build en Amplify

Amplify detectará automáticamente el archivo `amplify.yml` en la carpeta `frontend/`. Asegúrate de que el build path esté configurado correctamente:

- **Base directory:** `frontend` (si el repositorio tiene la estructura raíz)
- **Build settings:** Se usarán las del `amplify.yml`

### 6. Configurar CORS en API Gateway

Asegúrate de que el CORS en la API permita el origen de Amplify. El CORS ya está configurado para permitir todos los orígenes (`*`), pero si quieres restringirlo:

1. Ve a API Gateway en la consola de AWS
2. Selecciona tu API
3. Ve a "Actions" > "Enable CORS"
4. Configura los orígenes permitidos

### 7. Crear un usuario de prueba

```bash
aws cognito-idp admin-create-user \
  --user-pool-id <USER_POOL_ID> \
  --username test@example.com \
  --user-attributes Name=email,Value=test@example.com Name=email_verified,Value=true \
  --temporary-password TempPass123! \
  --message-action SUPPRESS
```

Luego establece una contraseña permanente:

```bash
aws cognito-idp admin-set-user-password \
  --user-pool-id <USER_POOL_ID> \
  --username test@example.com \
  --password YourPassword123! \
  --permanent
```

## Variables de Entorno Requeridas

### Backend (Serverless)
- `COGNITO_USER_POOL_ID`: ID del User Pool de Cognito
- `AWS_ACCOUNT`: ID de la cuenta de AWS

### Frontend (Amplify)
- `VITE_AWS_REGION`: Región de AWS (default: us-east-1)
- `VITE_COGNITO_USER_POOL_ID`: ID del User Pool de Cognito
- `VITE_COGNITO_USER_POOL_CLIENT_ID`: ID del App Client de Cognito
- `VITE_API_ENDPOINT`: URL base de la API Gateway

## Estructura de Rutas

El backend tiene dos conjuntos de rutas:

1. **Rutas originales** (con API Key):
   - `/resources-states`
   - `/schedules`
   - etc.

2. **Rutas con Cognito** (para el frontend):
   - `/api/resources-states`
   - `/api/schedules`
   - etc.

El frontend usa las rutas con prefijo `/api/` que están protegidas con el authorizer de Cognito.

## Troubleshooting

### Error: "No autorizado"
- Verifica que el token de Cognito se esté enviando correctamente
- Verifica que el User Pool ID esté correcto en la configuración del authorizer
- Verifica que el App Client tenga los permisos correctos

### Error: CORS
- Verifica que el CORS esté configurado correctamente en API Gateway
- Verifica que el origen de Amplify esté permitido

### Error: "Authorizer not found"
- Asegúrate de haber desplegado el servicio con la variable `COGNITO_USER_POOL_ID` configurada
- Verifica que el authorizer se haya creado correctamente en API Gateway
