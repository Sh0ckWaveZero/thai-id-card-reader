import { WebSocketServer, WebSocket } from "ws";
import ThaiIDCardReader from "../ThaiIDCardReader";
import { SERVER_CONFIG, CARD_READER_CONFIG, RESPONSE_MESSAGES } from "../config/constants";
import { WebSocketMessage } from "../types";
import { DataTransformer } from "../utils/dataTransformer";
import { MessageValidator } from "../utils/messageValidator";
import { logger } from "../utils/logger";
import { integrationManager } from "../core/integration-manager";

export class WebSocketServerManager {
  private wss: WebSocketServer | null = null;

  start(): void {
    this.wss = new WebSocketServer({ port: SERVER_CONFIG.WEBSOCKET_PORT });
    logger.info(`WebSocket server listening on port ${SERVER_CONFIG.WEBSOCKET_PORT}`);

    this.wss.on("connection", (ws) => this.handleConnection(ws));
  }

  private handleConnection(ws: WebSocket): void {
    logger.info("Client connected");

    this.sendWelcomeMessage(ws);
    
    const reader = this.initializeCardReader(ws);
    
    ws.on("message", (data) => this.handleMessage(ws, data));
    ws.on("close", () => this.handleDisconnection());
  }

  private sendWelcomeMessage(ws: WebSocket): void {
    this.sendMessage(ws, {
      message: RESPONSE_MESSAGES.CONNECTED,
    });
  }

  private initializeCardReader(ws: WebSocket): ThaiIDCardReader {
    const reader = new ThaiIDCardReader();
    reader.init();
    reader.setInsertCardDelay(CARD_READER_CONFIG.DEFAULT_INSERT_DELAY);
    reader.setReadTimeout(CARD_READER_CONFIG.DEFAULT_READ_TIMEOUT);

    reader.onReadComplete((data) => {
      logger.info("Card data read:", data);
      const processedData = DataTransformer.processSmartCardData(data as any);
      const patientData = DataTransformer.smartCardToMedis(processedData);
      
      logger.info("Sending patient data:", patientData);
      ws.send(JSON.stringify(patientData));
    });

    reader.onReadError((error) => {
      logger.error("Card read error:", error);
      this.sendMessage(ws, { error });
    });

    return reader;
  }

  private handleMessage(ws: WebSocket, data: any): void {
    const sanitizedData = MessageValidator.sanitizeString(data.toString());
    logger.debug("Received:", sanitizedData);

    // Use the new integration manager for message validation
    const validation = integrationManager.validateMessage(sanitizedData);
    
    if (validation.isValid && validation.message) {
      logger.info(`Message validated by: ${validation.integrationUsed}`);
      this.processMessage(ws, validation.message);
    } else {
      logger.warn("Invalid message received:", validation.error);
      this.sendMessage(ws, {
        error: validation.error || RESPONSE_MESSAGES.INVALID_JSON,
        metadata: validation.metadata
      });
    }
  }

  private processMessage(ws: WebSocket, message: WebSocketMessage): void {
    // Handle messages based on their content (integration-agnostic)
    if (message.mode === 'readsmartcard') {
      logger.info("Smart card reading mode activated");
      this.sendMessage(ws, {
        message: RESPONSE_MESSAGES.CARD_READER_READY,
      });
      this.startCardReading(ws);
      return;
    }

    // Handle standard message types
    switch (message.type) {
      case "startReading":
        logger.info("Starting card reading...");
        this.sendMessage(ws, {
          message: RESPONSE_MESSAGES.CARD_READER_READY,
        });
        break;

      case "stopReading":
        logger.info("Stopping card reading...");
        this.sendMessage(ws, {
          message: RESPONSE_MESSAGES.CARD_READING_STOPPED,
        });
        break;

      default:
        this.sendMessage(ws, {
          error: RESPONSE_MESSAGES.UNKNOWN_MESSAGE_TYPE,
        });
    }
  }

  private sendMessage(ws: WebSocket, message: WebSocketMessage): void {
    ws.send(JSON.stringify(message));
  }

  private handleDisconnection(): void {
    logger.info("Client disconnected");
  }

  stop(): void {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }
}