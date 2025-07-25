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
  COMMAND_MIN_TIMEOUT: 3000,
  // Enhanced timeouts for problematic operations
  CITIZEN_ID_RETRIES: 5,
  CITIZEN_ID_TIMEOUT: 10000,
  CARD_STABILIZATION_DELAY: 1500,
  TRANSACTION_RETRY_DELAY: 2000
} as const;

export const CONNECTION_MODES = [
  'SCARD_SHARE_SHARED',
  'SCARD_SHARE_EXCLUSIVE', 
  'SCARD_SHARE_DIRECT'
] as const;

export const PROTOCOL_STRATEGIES = {
  // Thai ID cards typically use T=0 protocol
  PREFERRED_PROTOCOLS: ['T=0', 'T=1', 'AUTO'],
  PROTOCOL_RETRY_DELAY: 1000,
  MAX_PROTOCOL_RETRIES: 2
} as const;

export const RESPONSE_MESSAGES = {
  CONNECTED: 'Connected to Thai ID Card Reader WebSocket Server',
  CARD_READER_READY: 'Card reader is ready. Please insert card.',
  CARD_READER_INITIALIZED: 'Card reader initialized. Please insert card.',
  CARD_READING_STOPPED: 'Card reading stopped.',
  CONNECTION_FAILED: 'Failed to connect to card after all attempts. Please remove and reinsert the card.',
  INVALID_JSON: 'Invalid JSON message',
  UNKNOWN_MESSAGE_TYPE: 'Unknown message type',
  NOT_FOUND: 'Not found',
  TRANSACTION_FAILED: 'Card transaction failed. Please remove and reinsert the card firmly.',
  CARD_NOT_READY: 'Card not ready for reading. Please wait and try again.',
  CITIZEN_ID_READ_FAILED: 'Failed to read citizen ID. Please ensure the card is properly inserted.',
  PROTOCOL_MISMATCH: 'Card protocol not compatible. The system will retry with different protocols.'
} as const;

export const PCSC_ERROR_CODES = {
  SCARD_E_NOT_TRANSACTED: 0x80100016,
  SCARD_E_PROTO_MISMATCH: 0x8010000F,
  SCARD_E_CARD_UNSUPPORTED: 0x8010001C,
  SCARD_E_NO_SMARTCARD: 0x8010000C,
  SCARD_E_TIMEOUT: 0x8010000A,
  SCARD_W_REMOVED_CARD: 0x80100069
} as const;

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
} as const;