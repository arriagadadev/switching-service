export default class HttpError extends Error {
  statusCode = 500;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'HttpError';
    if (statusCode)
      this.statusCode = statusCode;
  }
}
