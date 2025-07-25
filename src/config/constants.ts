export const SERVER_CONFIG = {
  WEBSOCKET_PORT: 8182,
  HTTP_PORT: 8085,
  CERT_FILE: 'cert.pem',
  KEY_FILE: 'key.pem'
} as const;

export const CARD_READER_CONFIG = {
  DEFAULT_READ_TIMEOUT: 15,
  DEFAULT_INSERT_DELAY: 500,
  CONNECTION_TIMEOUT: 5000,
  MAX_RETRIES: 3,
  RETRY_DELAY_BASE: 1000,
  COMMAND_MIN_TIMEOUT: 3000
} as const;

export const CONNECTION_MODES = [
  'SCARD_SHARE_SHARED',
  'SCARD_SHARE_EXCLUSIVE', 
  'SCARD_SHARE_DIRECT'
] as const;

export const RESPONSE_MESSAGES = {
  CONNECTED: 'Connected to Thai ID Card Reader WebSocket Server',
  CARD_READER_READY: 'Card reader is ready. Please insert card.',
  CARD_READER_INITIALIZED: 'Card reader initialized. Please insert card.',
  CARD_READING_STOPPED: 'Card reading stopped.',
  CONNECTION_FAILED: 'Failed to connect to card after all attempts. Please remove and reinsert the card.',
  INVALID_JSON: 'Invalid JSON message',
  UNKNOWN_MESSAGE_TYPE: 'Unknown message type',
  NOT_FOUND: 'Not found'
} as const;

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
} as const;