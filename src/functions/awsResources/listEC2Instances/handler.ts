import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import ec2Client from '@libs/ec2';

const listEC2Instances = async () => {
  try {
    const params = {
      Filters: [
        {
          Name: 'instance-state-name',
          Values: ['running', 'stopped', 'stopping', 'pending'],
        },
      ],
    };

    const result = await ec2Client.describeInstances(params).promise();

    const instances = [];
    for (const reservation of result.Reservations || []) {
      for (const instance of reservation.Instances || []) {
        const nameTag = instance.Tags?.find((tag) => tag.Key === 'Name');
        instances.push({
          instanceId: instance.InstanceId,
          name: nameTag?.Value || instance.InstanceId,
          state: instance.State?.Name || 'unknown',
          instanceType: instance.InstanceType,
          launchTime: instance.LaunchTime,
          privateIpAddress: instance.PrivateIpAddress,
          publicIpAddress: instance.PublicIpAddress,
          vpcId: instance.VpcId,
          subnetId: instance.SubnetId,
        });
      }
    }

    // Ordenar por nombre o instanceId
    instances.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return formatJSONResponse(instances);
  } catch (error: any) {
    console.error('Error listing EC2 instances:', error);
    return formatJSONResponse(
      {
        message: error.message || 'Error al listar instancias EC2',
      },
      500
    );
  }
};

export const main = middyfy(listEC2Instances);
