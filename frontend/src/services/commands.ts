import api from './api';
import type {
  Command,
  StoreCommandBody,
  UpdateCommandBody,
  CommandExecution,
} from '../types';

export const commandsService = {
  async getAll(): Promise<Command[]> {
    const response = await api.get('/commands');
    return response.data;
  },

  async getById(id: string): Promise<Command> {
    const response = await api.get(`/commands/${id}`);
    return response.data;
  },

  async create(data: StoreCommandBody): Promise<Command> {
    const response = await api.post('/commands', data);
    return response.data;
  },

  async update(id: string, data: UpdateCommandBody): Promise<Command> {
    const response = await api.put(`/commands/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<Command> {
    const response = await api.delete(`/commands/${id}`);
    return response.data;
  },

  async execute(id: string, resourceIds: string[]): Promise<CommandExecution> {
    const response = await api.post(`/commands/${id}/execute`, { resourceIds });
    return response.data;
  },

  async getExecutions(): Promise<CommandExecution[]> {
    const response = await api.get('/command-executions');
    return response.data;
  },

  async getExecutionById(id: string): Promise<CommandExecution> {
    const response = await api.get(`/command-executions/${id}`);
    return response.data;
  },

  async syncExecution(id: string): Promise<CommandExecution> {
    const response = await api.post(`/command-executions/${id}/sync`);
    return response.data;
  },
};
