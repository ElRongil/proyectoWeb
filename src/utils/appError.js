class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }

  static badRequest(msg) { return new AppError(msg, 400); }
  static unauthorized(msg) { return new AppError(msg, 401); }
  static forbidden(msg) { return new AppError(msg, 403); }
  static notFound(msg) { return new AppError(msg, 404); }
  static conflict(msg) { return new AppError(msg, 409); }
  static tooMany(msg) { return new AppError(msg, 429); }
  static internal(msg = 'Error interno del servidor') { return new AppError(msg, 500); }
}

export default AppError;