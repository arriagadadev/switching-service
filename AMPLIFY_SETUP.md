# Configuración de Amplify para Switching Service Frontend

Este documento describe cómo configurar el frontend en AWS Amplify con autenticación Cognito.

## Prerrequisitos

1. Tener la API desplegada y funcionando (el User Pool y App Client se crean automáticamente)

## Pasos de Configuración

### 1. Desplegar el Backend

El User Pool de Cognito y el App Client se crean automáticamente cuando despliegas el servicio. Solo necesitas tener configurado `AWS_ACCOUNT`:

```bash
export AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
npm run deploy:dev  # o deploy:qa, deploy:prod según el stage
```

### 2. Obtener los IDs de Cognito

Después del despliegue, puedes obtener los IDs de dos formas:

**Opción A: Desde los Outputs de CloudFormation**
```bash
aws cloudformation describe-stacks \
  --stack-name switching-service-<stage> \
  --query 'Stacks[0].Outputs[?OutputKey==`CognitoUserPoolId` || OutputKey==`CognitoUserPoolClientId` || OutputKey==`ApiGatewayRestApiUrl`].{Key:OutputKey,Value:OutputValue}' \
  --output table
```

**Opción B: Desde la consola de AWS**
1. Ve a CloudFormation en la consola de AWS
2. Selecciona el stack `switching-service-<stage>`
3. Ve a la pestaña "Outputs"
4. Copia los valores de:
   - `CognitoUserPoolId`
   - `CognitoUserPoolClientId`
   - `ApiGatewayRestApiUrl`

### 3. Configurar Amplify

1. Conecta tu repositorio de GitHub a Amplify
2. En la configuración de la app de Amplify, ve a **"Environment variables"** (Variables de entorno)
3. Agrega las siguientes variables de entorno (IMPORTANTE: deben tener el prefijo `VITE_`):

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

**IMPORTANTE:** 
- Las variables de entorno en Amplify se pasan automáticamente al proceso de build
- Vite solo expone variables que comienzan con `VITE_` al código del cliente
- Asegúrate de que todas las variables tengan el prefijo `VITE_`
- Después de agregar las variables, necesitas hacer un nuevo build para que se apliquen

### 4. Configurar el build en Amplify

Amplify detectará automáticamente el archivo `amplify.yml` en la raíz del repositorio. El archivo ya está configurado para trabajar con la carpeta `frontend/`.

**IMPORTANTE:** En la configuración de Amplify:
- **Base directory:** Dejar vacío (raíz del repositorio) - NO configurar como `frontend`
- **Build settings:** Se usarán automáticamente las del `amplify.yml` en la raíz

Si configuras "Base directory" como `frontend`, los comandos fallarán porque intentarán hacer `cd frontend` desde dentro de `frontend`.

### 5. Configurar CORS en API Gateway

Asegúrate de que el CORS en la API permita el origen de Amplify. El CORS ya está configurado para permitir todos los orígenes (`*`), pero si quieres restringirlo:

1. Ve a API Gateway en la consola de AWS
2. Selecciona tu API
3. Ve a "Actions" > "Enable CORS"
4. Configura los orígenes permitidos

### 6. Crear un usuario de prueba

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
- `AWS_ACCOUNT`: ID de la cuenta de AWS (se obtiene automáticamente o se puede configurar manualmente)

**Nota:** El `COGNITO_USER_POOL_ID` y `COGNITO_USER_POOL_CLIENT_ID` se crean automáticamente y están disponibles como variables de entorno en las funciones Lambda.

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
- Asegúrate de haber desplegado el servicio correctamente
- Verifica que el authorizer se haya creado correctamente en API Gateway
- Verifica que el User Pool se haya creado correctamente (debería aparecer en la consola de Cognito)

### Obtener los valores después del despliegue

Puedes usar este script para obtener todos los valores necesarios:

```bash
#!/bin/bash
STAGE=dev  # o qa, prod

STACK_NAME="switching-service-${STAGE}"

echo "Obteniendo valores del stack ${STACK_NAME}..."

USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --query 'Stacks[0].Outputs[?OutputKey==`CognitoUserPoolId`].OutputValue' \
  --output text)

CLIENT_ID=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --query 'Stacks[0].Outputs[?OutputKey==`CognitoUserPoolClientId`].OutputValue' \
  --output text)

API_URL=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayRestApiUrl`].OutputValue' \
  --output text)

echo ""
echo "=== Valores para Amplify ==="
echo "VITE_COGNITO_USER_POOL_ID=${USER_POOL_ID}"
echo "VITE_COGNITO_USER_POOL_CLIENT_ID=${CLIENT_ID}"
echo "VITE_API_ENDPOINT=${API_URL}"
echo "VITE_AWS_REGION=us-east-1"
```