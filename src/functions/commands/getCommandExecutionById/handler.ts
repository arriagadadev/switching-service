import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { getCommandExecutionById } from '@libs/commands';

const getCommandExecutionByIdHandler = async (event) => {
  try {
    const { executionId } = event.pathParameters;
    const execution = await getCommandExecutionById(executionId);
    if (!execution) {
      return formatJSONResponse({ message: 'Ejecución no encontrada' }, 404);
    }
    return formatJSONResponse(execution);
  } catch ({ message, statusCode = 500 }) {
    return formatJSONResponse({ message }, statusCode);
  }
};

export const main = middyfy(getCommandExecutionByIdHandler);
