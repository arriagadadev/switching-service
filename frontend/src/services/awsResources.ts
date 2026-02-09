import api from './api';

export interface EC2Instance {
  instanceId: string;
  name: string;
  state: string;
  instanceType: string;
  launchTime?: string;
  privateIpAddress?: string;
  publicIpAddress?: string;
  vpcId?: string;
  subnetId?: string;
}

export interface RDSInstance {
  dbInstanceIdentifier: string;
  name: string;
  status: string;
  engine: string;
  engineVersion: string;
  instanceClass: string;
  endpoint?: string;
  port?: number;
  allocatedStorage?: number;
  multiAZ?: boolean;
  publiclyAccessible?: boolean;
}

export interface ECSInstance {
  clusterName: string;
  serviceName: string;
  identifier: string;
  name: string;
  status: string;
  desiredCount: number;
  runningCount: number;
  launchType?: string;
}

export const awsResourcesService = {
  async getEC2Instances(): Promise<EC2Instance[]> {
    const response = await api.get('/aws-resources/ec2-instances');
    return response.data;
  },

  async getRDSInstances(): Promise<RDSInstance[]> {
    const response = await api.get('/aws-resources/rds-instances');
    return response.data;
  },

  async getECSInstances(): Promise<ECSInstance[]> {
    const response = await api.get('/aws-resources/ecs-instances');
    return response.data;
  },
};
