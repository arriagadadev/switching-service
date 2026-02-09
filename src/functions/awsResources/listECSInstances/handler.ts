import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { ecs } from '@libs/ecs';

/**
 * Extrae el nombre del cluster desde el ARN.
 * Formato: arn:aws:ecs:region:account:cluster/cluster-name
 */
const extractClusterName = (arn: string): string => {
  const parts = arn.split('/');
  return parts[parts.length - 1] || arn;
};

/**
 * Extrae el nombre del servicio desde el ARN.
 * Formato: arn:aws:ecs:region:account:service/cluster-name/service-name
 */
const extractServiceName = (arn: string): string => {
  const parts = arn.split('/');
  return parts[parts.length - 1] || arn;
};

const listECSInstances = async () => {
  try {
    const instances: Array<{
      clusterName: string;
      serviceName: string;
      identifier: string;
      name: string;
      status: string;
      desiredCount: number;
      runningCount: number;
      launchType?: string;
    }> = [];

    // Listar todos los clusters
    let clusterToken: string | undefined;
    do {
      const clustersResult = await ecs
        .listClusters({ maxResults: 100, nextToken: clusterToken })
        .promise();

      const clusterArns = clustersResult.clusterArns || [];
      clusterToken = clustersResult.nextToken;

      for (const clusterArn of clusterArns) {
        const clusterName = extractClusterName(clusterArn);

        // Listar servicios del cluster
        let serviceToken: string | undefined;
        do {
          const servicesResult = await ecs
            .listServices({
              cluster: clusterName,
              maxResults: 100,
              nextToken: serviceToken,
            })
            .promise();

          const serviceArns = servicesResult.serviceArns || [];
          serviceToken = servicesResult.nextToken;

          if (serviceArns.length === 0) continue;

          // DescribeServices permite hasta 10 servicios por llamada
          const describeResult = await ecs
            .describeServices({
              cluster: clusterName,
              services: serviceArns,
            })
            .promise();

          for (const svc of describeResult.services || []) {
            const serviceName = svc.serviceName || extractServiceName(svc.serviceArn || '');
            const identifier = `${clusterName}/${serviceName}`;
            const desiredCount = svc.desiredCount ?? 0;
            const runningCount = svc.runningCount ?? 0;
            const status = desiredCount > 0 ? (runningCount > 0 ? 'running' : 'pending') : 'stopped';

            instances.push({
              clusterName,
              serviceName,
              identifier,
              name: `${serviceName} (${clusterName})`,
              status,
              desiredCount,
              runningCount,
              launchType: svc.launchType,
            });
          }
        } while (serviceToken);
      }
    } while (clusterToken);

    // Ordenar por nombre
    instances.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

    return formatJSONResponse(instances);
  } catch (error: any) {
    console.error('Error listing ECS instances:', error);
    return formatJSONResponse(
      {
        message: error.message || 'Error al listar servicios ECS',
      },
      500
    );
  }
};

export const main = middyfy(listECSInstances);
