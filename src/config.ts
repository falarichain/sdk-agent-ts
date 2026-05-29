export const DEFAULTS = {
  segmentSize: 4 * 1024 * 1024,       // 4 MB
  dataShards: 4,
  parityShards: 2,
  storageClass: 'permanent',
  duration: 86400 * 365,               // 1 year
  timeout: 60_000,
  retries: 2,
} as const;

export const ENCRYPTION = {
  algorithm: 'AES-256-GCM/segment-v1',
  ownerWrapAlgorithm: 'AES-256-GCM/key-wrap-v1',
  passcodeWrapAlgorithm: 'AES-256-GCM/passcode-wrap-v1',
  addressWrapAlgorithm: 'AES-256-GCM/address-link-wrap-v1',
  passcodeKDF: 'PBKDF2-SHA256/passcode-v1',
  pbkdf2Iterations: 310_000,
  gcmTagLength: 16,
  gcmIVLength: 12,
  keyLength: 32,
  nonceBaseLength: 32,
  saltLength: 16,
} as const;

export const AGENT_KEY_PREFIX = 'fara_';
