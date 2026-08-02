export class NotFoundError extends Error {
  status: number;
  statusMessage: string;
  constructor(message: string, status = 404, statusMessage = "Not found") {
    super(message);
    this.name = "NotFoundError";
    this.status = status;
    this.statusMessage = statusMessage;
  }
}

export class BadRequestError extends Error {
  status: number;
  statusMessage: string;
  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
    this.status = 400;
    this.statusMessage = "Bad request";
  }
}
