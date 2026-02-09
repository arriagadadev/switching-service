import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { getCommandExecutionById, updateCommandExecution } from '@libs/commands';
import { getCommandInvocation } from '@libs/ssm';

const syncCommandExecutionHandler = async (event) => {
  try {
    const { executionId } = event.pathParameters;
    const execution = await getCommandExecutionById(executionId);
    if (!execution) {
      return formatJSONResponse({ message: 'Ejecución no encontrada' }, 404);
    }
    if (!execution.ssmCommandId) {
      return formatJSONResponse(execution);
    }

    const invocations = [...execution.invocations];
    let allDone = true;
    let anyFailed = false;

    for (let i = 0; i < invocations.length; i++) {
      const inv = invocations[i];
      if (inv.status === 'Success' || inv.status === 'Failed' || inv.status === 'Cancelled' || inv.status === 'TimedOut') {
        continue;
      }
      allDone = false;
      try {
        const result = await getCommandInvocation(execution.ssmCommandId!, inv.instanceId);
        invocations[i] = {
          ...inv,
          status: result.Status as any,
          output: result.StandardOutputContent,
          error: result.StandardErrorContent,
        };
        if (result.Status === 'Failed' || result.Status === 'Cancelled' || result.Status === 'TimedOut') {
          anyFailed = true;
        }
        if (result.Status !== 'Pending' && result.Status !== 'InProgress') {
          allDone = true;
        }
      } catch (e) {
        console.error(`Error fetching invocation for ${inv.instanceId}:`, e);
      }
    }

    const terminalStatuses = ['Success', 'Failed', 'Cancelled', 'TimedOut'];
    const allTerminal = invocations.every((inv) => terminalStatuses.includes(inv.status));
    let newStatus = execution.status;
    if (allTerminal) {
      const successCount = invocations.filter((inv) => inv.status === 'Success').length;
      if (successCount === invocations.length) newStatus = 'success';
      else if (successCount > 0) newStatus = 'partial';
      else newStatus = 'failed';
    }

    const updated = await updateCommandExecution(executionId, {
      invocations,
      status: newStatus,
      completedAt: allTerminal ? Date.now() : undefined,
    });

    return formatJSONResponse(updated);
  } catch ({ message, statusCode = 500 }) {
    return formatJSONResponse({ message }, statusCode);
  }
};

export const main = middyfy(syncCommandExecutionHandler);
