import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { getResourceStateById } from '@libs/resourcesStates';

const getResourceState = async (event) => {
  try {
    const { resourceStateId } = event.pathParameters;
    const resourceState = await getResourceStateById(resourceStateId);
    if (!resourceState) {
      return formatJSONResponse({
        message: 'Entity does not exists',
      }, 404);
    }
    return formatJSONResponse(resourceState);
  } catch ({ message, statusCode = 500 }) {
    console.log(message);
    return formatJSONResponse({
      message,
    }, statusCode);
  }
};

export const main = middyfy(getResourceState);