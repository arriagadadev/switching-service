import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { updateCommand } from '@libs/commands';
import type { UpdateCommandBody } from 'src/types';

const updateCommandHandler = async (event) => {
  try {
    const { commandId } = event.pathParameters;
    const body: UpdateCommandBody = event.body;
    if (!body?.name?.trim()) {
      return formatJSONResponse({ message: 'El nombre es requerido' }, 400);
    }
    if (!body?.command?.trim()) {
      return formatJSONResponse({ message: 'El comando es requerido' }, 400);
    }
    const command = await updateCommand(commandId, {
      name: body.name.trim(),
      command: body.command.trim(),
      description: body.description?.trim(),
      linkedResourceIds: body.linkedResourceIds || [],
    });
    return formatJSONResponse(command);
  } catch ({ message, statusCode = 500 }) {
    return formatJSONResponse({ message }, statusCode);
  }
};

export const main = middyfy(updateCommandHandler);
