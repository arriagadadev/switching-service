import api from './api';
import type { ScheduleResource, StoreScheduleBody, UpdateScheduleBody } from '../types';

export const schedulesService = {
  async getAll(): Promise<ScheduleResource[]> {
    const response = await api.get('/schedules');
    return response.data;
  },

  async getById(id: string): Promise<ScheduleResource> {
    const response = await api.get(`/schedules/${id}`);
    return response.data;
  },

  async create(data: StoreScheduleBody): Promise<ScheduleResource> {
    const response = await api.post('/schedules', data);
    return response.data;
  },

  async update(id: string, data: UpdateScheduleBody): Promise<ScheduleResource> {
    const response = await api.put(`/schedules/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/schedules/${id}`);
  },
};
