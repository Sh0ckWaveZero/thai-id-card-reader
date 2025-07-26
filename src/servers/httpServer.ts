import * as http from "http";
import * as https from "https";
import * as fs from "fs";
import ThaiIDCardReader from "../thaiIdCardReader";
import { SERVER_CONFIG, CARD_READER_CONFIG, CORS_HEADERS, RESPONSE_MESSAGES } from "../config/constants";
import { HttpResponse } from "../types";
import { logger } from "../utils/logger";

export class HttpServerManager {
  private server: http.Server | https.Server | null = null;

  private requestHandler = (
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): void => {
    this.setCorsHeaders(res);

    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.url === "/readnationcard" && req.method === "POST") {
      this.handleCardReadRequest(req, res);
    } else {
      this.sendErrorResponse(res, 404, RESPONSE_MESSAGES.NOT_FOUND);
    }
  };

  private setCorsHeaders(res: http.ServerResponse): void {
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  }

  private handleCardReadRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): void {
    logger.info("HTTP request received for card reading");

    const reader = new ThaiIDCardReader();
    reader.init();
    reader.setInsertCardDelay(CARD_READER_CONFIG.DEFAULT_INSERT_DELAY);
    reader.setReadTimeout(CARD_READER_CONFIG.DEFAULT_READ_TIMEOUT);

    reader.onReadComplete((data: any) => {
      logger.info("Card data read via HTTP", data);
      this.sendSuccessResponse(res, { data });
    });

    reader.onReadError((error: string) => {
      logger.error("Card read error via HTTP:", error);
      this.sendErrorResponse(res, 500, error);
    });

    setTimeout(() => {
      this.sendSuccessResponse(res, {
        message: RESPONSE_MESSAGES.CARD_READER_INITIALIZED,
      });
    }, 1000);
  }

  private sendSuccessResponse<T>(res: http.ServerResponse, data: Partial<HttpResponse<T>>): void {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, ...data }));
  }

  private sendErrorResponse(res: http.ServerResponse, statusCode: number, error: string): void {
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: false, error }));
  }

  start(): void {
    try {
      if (this.hasSSLCertificates()) {
        this.startHttpsServer();
      } else {
        this.startHttpServer();
      }
    } catch (error) {
      logger.error("Server startup error:", error);
      this.startHttpServer(); // Fallback to HTTP
    }
  }

  private hasSSLCertificates(): boolean {
    return fs.existsSync(SERVER_CONFIG.CERT_FILE) && fs.existsSync(SERVER_CONFIG.KEY_FILE);
  }

  private startHttpsServer(): void {
    const httpsOptions = {
      key: fs.readFileSync(SERVER_CONFIG.KEY_FILE),
      cert: fs.readFileSync(SERVER_CONFIG.CERT_FILE),
    };

    this.server = https.createServer(httpsOptions, this.requestHandler);
    this.server.listen(SERVER_CONFIG.HTTP_PORT, () => {
      logger.info(`HTTPS server listening on port ${SERVER_CONFIG.HTTP_PORT}`);
    });
  }

  private startHttpServer(): void {
    this.server = http.createServer(this.requestHandler);
    this.server.listen(SERVER_CONFIG.HTTP_PORT, () => {
      logger.info(`HTTP server listening on port ${SERVER_CONFIG.HTTP_PORT}`);
    });
  }

  stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}