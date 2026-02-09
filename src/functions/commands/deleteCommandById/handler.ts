import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { deleteCommandById } from '@libs/commands';

const deleteCommandByIdHandler = async (event) => {
  try {
    const { commandId } = event.pathParameters;
    const command = await deleteCommandById(commandId);
    return formatJSONResponse(command);
  } catch ({ message, statusCode = 500 }) {
    return formatJSONResponse({ message }, statusCode);
  }
};

export const main = middyfy(deleteCommandByIdHandler);
