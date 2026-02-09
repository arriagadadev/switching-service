import { SSM } from 'aws-sdk';

export const ssm = new SSM();

/**
 * Envía un comando shell a instancias EC2 vía SSM.
 * Retorna el CommandId de AWS para rastrear la ejecución.
 */
export const sendCommand = async (
  instanceIds: string[],
  commands: string[]
): Promise<{ CommandId: string }> => {
  const result = await ssm
    .sendCommand({
      DocumentName: 'AWS-RunShellScript',
      InstanceIds: instanceIds,
      Parameters: {
        commands,
      },
    })
    .promise();

  if (!result.Command?.CommandId) {
    throw new Error('SSM SendCommand no devolvió CommandId');
  }

  return { CommandId: result.Command.CommandId };
};

/**
 * Obtiene el estado y salida de una invocación individual de un comando.
 */
export const getCommandInvocation = async (
  commandId: string,
  instanceId: string
): Promise<{
  Status: string;
  StandardOutputContent?: string;
  StandardErrorContent?: string;
}> => {
  const result = await ssm
    .getCommandInvocation({
      CommandId: commandId,
      InstanceId: instanceId,
    })
    .promise();

  return {
    Status: result.Status || 'Unknown',
    StandardOutputContent: result.StandardOutputContent,
    StandardErrorContent: result.StandardErrorContent,
  };
};
