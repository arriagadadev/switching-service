import { ECS } from 'aws-sdk';

export const ecs = new ECS();

export const updateService = async (
  cluster: string,
  service: string,
): Promise<void> => {
  try {
    const params = {
      cluster,
      service,
      forceNewDeployment: true,
    };
    await ecs.updateService(params).promise();
    console.log(`Service ${service} in cluster ${cluster} updated successfully.`);
  } catch (error) {
    console.error(`Error updating service ${service} in cluster ${cluster}:`, error);
    throw error;
  }
};

/**
 * Enciende o apaga un servicio ECS ajustando desiredCount (1 u 0).
 */
export const setServicePower = async (
  cluster: string,
  service: string,
  power: 'on' | 'off',
  wait: boolean = true,
): Promise<void> => {
  const desiredCount = power === 'on' ? 1 : 0;

  try {
    await ecs
      .updateService({
        cluster,
        service,
        desiredCount,
        forceNewDeployment: power === 'on',
      })
      .promise();

    console.log(
      `Service ${service} in cluster ${cluster} set to desiredCount=${desiredCount} (${power}).`
    );

    if (wait) {
      await ecs
        .waitFor('servicesStable', {
          cluster,
          services: [service],
        })
        .promise();
      console.log(`Service ${service} is now stable.`);
    }
  } catch (error) {
    console.error(
      `Error setting power=${power} for service ${service} in cluster ${cluster}:`,
      error
    );
    throw error;
  }
};

export const powerOnService = (cluster: string, service: string, wait = true) =>
  setServicePower(cluster, service, 'on', wait);

export const powerOffService = (cluster: string, service: string, wait = true) =>
  setServicePower(cluster, service, 'off', wait);

/**
 * Retorna true si el servicio tiene desiredCount > 0, false si está en 0.
 */
export const isServicePoweredOn = async (
  cluster: string,
  service: string,
): Promise<boolean> => {
  try {
    const res = await ecs
      .describeServices({
        cluster,
        services: [service],
      })
      .promise();

    if (!res.services || res.services.length === 0) {
      throw new Error(`Service ${service} not found in cluster ${cluster}`);
    }

    const svc = res.services[0];
    const poweredOn = (svc.desiredCount ?? 0) > 0;

    console.log(
      `Service ${service} in cluster ${cluster} is ${poweredOn ? 'ON' : 'OFF'} (desiredCount=${svc.desiredCount}).`
    );

    return poweredOn;
  } catch (error) {
    console.error(
      `Error checking power state for service ${service} in cluster ${cluster}:`,
      error
    );
    throw error;
  }
};
