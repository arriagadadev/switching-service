import api from './api';
import type { ResourceStateResource, StoreResourceStateBody, UpdateResourceStateBody } from '../types';

export const resourcesService = {
  async getAll(): Promise<ResourceStateResource[]> {
    const response = await api.get('/resources-states');
    return response.data;
  },

  async getById(id: string): Promise<ResourceStateResource> {
    const response = await api.get(`/resources-states/${id}`);
    return response.data;
  },

  async create(data: StoreResourceStateBody): Promise<ResourceStateResource> {
    const response = await api.post('/resources-states', data);
    return response.data;
  },

  async update(id: string, data: UpdateResourceStateBody): Promise<ResourceStateResource> {
    const response = await api.put(`/resources-states/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/resources-states/${id}`);
  },

  async start(id: string): Promise<void> {
    await api.post(`/resources-states/${id}/start`);
  },

  async stop(id: string): Promise<void> {
    await api.post(`/resources-states/${id}/stop`);
  },
};
