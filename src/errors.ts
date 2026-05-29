export class FalariError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FalariError';
  }
}

export class AuthenticationError extends FalariError {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class PermissionError extends FalariError {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

export class NetworkError extends FalariError {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ChainApiError extends NetworkError {
  status: number;
  body: string;
  constructor(message: string, status: number, body: string) {
    super(message);
    this.name = 'ChainApiError';
    this.status = status;
    this.body = body;
  }
}

export class SigningError extends FalariError {
  constructor(message: string) {
    super(message);
    this.name = 'SigningError';
  }
}

export class EncryptionError extends FalariError {
  constructor(message: string) {
    super(message);
    this.name = 'EncryptionError';
  }
}

export class UploadError extends FalariError {
  constructor(message: string) {
    super(message);
    this.name = 'UploadError';
  }
}

export class DownloadError extends FalariError {
  constructor(message: string) {
    super(message);
    this.name = 'DownloadError';
  }
}
