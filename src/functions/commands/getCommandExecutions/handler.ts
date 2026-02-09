import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { getCommandExecutions } from '@libs/commands';

const getCommandExecutionsHandler = async () => {
  try {
    const executions = await getCommandExecutions(100);
    return formatJSONResponse(executions);
  } catch ({ message, statusCode = 500 }) {
    return formatJSONResponse({ message }, statusCode);
  }
};

export const main = middyfy(getCommandExecutionsHandler);
