import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { getResourcesStates } from '@libs/resourcesStates';

const getAllResoucesStates = async () => {
  try {
    const resoucesStates = await getResourcesStates();
    return formatJSONResponse(resoucesStates);
  } catch ({ message, statusCode = 500 }) {
    console.log(message);
    return formatJSONResponse({
      message,
    }, statusCode);
  }
};

export const main = middyfy(getAllResoucesStates);