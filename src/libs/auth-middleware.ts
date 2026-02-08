import { MiddlewareObj } from '@middy/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { formatJSONResponse } from './api-gateway';

interface AuthContext {
  authMethod?: 'apiKey' | 'cognito';
  userId?: string;
  email?: string;
}

// Middleware que soporta tanto API Key como Cognito
export const authMiddleware = (): MiddlewareObj<APIGatewayProxyEvent, APIGatewayProxyResult> => {
  return {
    before: async (request) => {
      const event = request.event;
      const headers = event.headers || {};

      // Verificar si hay API Key (para compatibilidad con endpoints existentes)
      const apiKey = headers['x-api-key'] || headers['X-Api-Key'];
      
      // Verificar si hay token de Cognito
      const authHeader = headers['Authorization'] || headers['authorization'];
      const cognitoToken = authHeader?.replace('Bearer ', '');

      // Si hay API Key, permitir acceso (método original)
      if (apiKey) {
        request.context.authMethod = 'apiKey';
        return;
      }

      // Si hay token de Cognito, validar (la validación real se hace en API Gateway con el authorizer)
      if (cognitoToken) {
        // El authorizer de Cognito ya validó el token, solo verificamos que esté presente
        // La información del usuario viene en event.requestContext.authorizer
        const authorizer = event.requestContext?.authorizer;
        if (authorizer) {
          request.context.authMethod = 'cognito';
          request.context.userId = authorizer.claims?.sub || authorizer.principalId;
          request.context.email = authorizer.claims?.email;
        }
        return;
      }

      // Si no hay ningún método de autenticación, rechazar
      request.response = formatJSONResponse(
        {
          message: 'No autorizado. Se requiere API Key o token de Cognito.',
        },
        401
      );
    },
  };
};
