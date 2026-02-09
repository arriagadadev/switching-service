import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { getCommandById, storeCommandExecution } from '@libs/commands';
import { getResourceStateById } from '@libs/resourcesStates';
import { sendCommand } from '@libs/ssm';
import type { ExecuteCommandBody } from 'src/types';

const executeCommandHandler = async (event) => {
  try {
    const { commandId } = event.pathParameters;
    const body: ExecuteCommandBody = event.body;

    if (!body?.resourceIds?.length) {
      return formatJSONResponse({ message: 'Debe seleccionar al menos un recurso EC2' }, 400);
    }

    const command = await getCommandById(commandId);
    if (!command) {
      return formatJSONResponse({ message: 'Comando no encontrado' }, 404);
    }

    const ec2Resources: Array<{ id: string; instanceId: string; name: string }> = [];
    for (const resourceId of body.resourceIds) {
      const resource = await getResourceStateById(resourceId);
      if (!resource) continue;
      if (resource.type !== 'EC2') continue;
      ec2Resources.push({
        id: resource.id,
        instanceId: resource.resourceIdentifier,
        name: resource.name,
      });
    }

    if (ec2Resources.length === 0) {
      return formatJSONResponse({ message: 'No se encontraron recursos EC2 válidos' }, 400);
    }

    const instanceIds = ec2Resources.map((r) => r.instanceId);
    const { CommandId: ssmCommandId } = await sendCommand(instanceIds, [command.command]);

    const invocations = ec2Resources.map((r) => ({
      resourceId: r.id,
      instanceId: r.instanceId,
      resourceName: r.name,
      status: 'Pending' as const,
    }));

    const execution = await storeCommandExecution({
      commandId: command.id,
      commandName: command.name,
      resourceIds: ec2Resources.map((r) => r.id),
      status: 'running',
      ssmCommandId,
      invocations,
      timestamp: Date.now(),
    });

    return formatJSONResponse(execution);
  } catch ({ message, statusCode = 500 }) {
    console.error('Error executing command:', message);
    return formatJSONResponse({ message }, statusCode);
  }
};

export const main = middyfy(executeCommandHandler);
