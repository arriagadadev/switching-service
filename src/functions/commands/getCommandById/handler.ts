import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { getCommandById } from '@libs/commands';

const getCommandByIdHandler = async (event) => {
  try {
    const { commandId } = event.pathParameters;
    const command = await getCommandById(commandId);
    if (!command) {
      return formatJSONResponse({ message: 'Comando no encontrado' }, 404);
    }
    return formatJSONResponse(command);
  } catch ({ message, statusCode = 500 }) {
    return formatJSONResponse({ message }, statusCode);
  }
};

export const main = middyfy(getCommandByIdHandler);
