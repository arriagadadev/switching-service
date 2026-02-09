import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { getAllCommands } from '@libs/commands';

const getCommands = async () => {
  try {
    const commands = await getAllCommands();
    return formatJSONResponse(commands);
  } catch ({ message, statusCode = 500 }) {
    return formatJSONResponse({ message }, statusCode);
  }
};

export const main = middyfy(getCommands);
