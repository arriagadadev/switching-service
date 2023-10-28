import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { deleteResourceStateById } from '@libs/resourcesStates';

const removeResourceState = async (event) => {
  try {
    const { resourceStateId } = event.pathParameters;
    const resourceState = await deleteResourceStateById(resourceStateId);
    return formatJSONResponse(resourceState);
  } catch ({ message, statusCode = 500 }) {
    console.log(message);
    return formatJSONResponse({
      message,
    }, statusCode);
  }
};

export const main = middyfy(removeResourceState);