import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import rdsClient from '@libs/rds';

const listRDSInstances = async () => {
  try {
    const result = await rdsClient.describeDBInstances().promise();

    const instances = (result.DBInstances || []).map((instance) => ({
      dbInstanceIdentifier: instance.DBInstanceIdentifier,
      name: instance.DBInstanceIdentifier,
      status: instance.DBInstanceStatus,
      engine: instance.Engine,
      engineVersion: instance.EngineVersion,
      instanceClass: instance.DBInstanceClass,
      endpoint: instance.Endpoint?.Address,
      port: instance.Endpoint?.Port,
      allocatedStorage: instance.AllocatedStorage,
      multiAZ: instance.MultiAZ,
      publiclyAccessible: instance.PubliclyAccessible,
    }));

    // Ordenar por nombre
    instances.sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return formatJSONResponse(instances);
  } catch (error: any) {
    console.error('Error listing RDS instances:', error);
    return formatJSONResponse(
      {
        message: error.message || 'Error al listar instancias RDS',
      },
      500
    );
  }
};

export const main = middyfy(listRDSInstances);
