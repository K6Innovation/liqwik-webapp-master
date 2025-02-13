export default class CustomError extends Error {
  constructor(message: string, statusCode: number) {
    super(message);
    //@ts-ignore
    this.statusCode = statusCode;
  }
}
