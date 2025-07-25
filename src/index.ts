import ThaiIDCardReader from "./ThaiIDCardReader";
import { WebSocketServer } from "ws";
import * as http from "http";
import * as https from "https";
import * as fs from "fs";
import { MessageValidator } from "./utils/messageValidator";

// Helper functions to extract address components from Thai address string
function extractHouseNumber(address: string): string {
  const match = address.match(/^(\d+\/?\d*)/);
  return match ? match[1] : "";
}

function extractVillageNumber(address: string): string {
  const match = address.match(/หมู่\s*(\d+)/);
  return match ? match[1] : "";
}

function extractTambol(address: string): string {
  const match = address.match(/ตำบล([^\s]+)/);
  return match ? `ตำบล${match[1]}` : "";
}

function extractAmphur(address: string): string {
  const match = address.match(/อำเภอ([^\s]+)/);
  return match ? `อำเภอ${match[1]}` : "";
}

// Request handler for both HTTP and HTTPS
const requestHandler = (
  req: http.IncomingMessage,
  res: http.ServerResponse
) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === "/readnationcard" && req.method === "POST") {
    console.log("HTTP request received for card reading");

    const reader = new ThaiIDCardReader();
    reader.init();
    reader.setInsertCardDelay(500); // Increased for better reliability
    reader.setReadTimeout(15); // Increased timeout

    reader.onReadComplete((data) => {
      console.log("Card data read via HTTP:", data);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          data: data,
        })
      );
    });

    reader.onReadError((error) => {
      console.log("Card read error via HTTP:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: error,
        })
      );
    });

    // Send response that card reader is ready
    setTimeout(() => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          message: "Card reader initialized. Please insert card.",
        })
      );
    }, 1000);
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  }
};

// Try to create HTTPS server if certificates exist, otherwise use HTTP
try {
  if (fs.existsSync("cert.pem") && fs.existsSync("key.pem")) {
    const httpsOptions = {
      key: fs.readFileSync("key.pem"),
      cert: fs.readFileSync("cert.pem"),
    };

    const httpsServer = https.createServer(httpsOptions, requestHandler);
    httpsServer.listen(8085, () => {
      console.log("HTTPS server listening on port 8085");
    });
  } else {
    // Create HTTP server for REST API if no certificates
    const httpServer = http.createServer(requestHandler);
    httpServer.listen(8085, () => {
      console.log("HTTP server listening on port 8085");
    });
  }
} catch (error) {
  console.log("Server startup error:", error);
  // Fallback to HTTP server
  const httpServer = http.createServer(requestHandler);
  httpServer.listen(8085, () => {
    console.log("HTTP server listening on port 8085 (fallback)");
  });
}

// Create WebSocket server
const wss = new WebSocketServer({ port: 8182 });

console.log("WebSocket server listening on port 8182");

wss.on("connection", function connection(ws) {
  console.log("Client connected");

  // Send welcome message
  ws.send(
    JSON.stringify({
      message: "Connected to Thai ID Card Reader WebSocket Server",
    })
  );

  // Initialize card reader for this connection
  const reader = new ThaiIDCardReader();
  reader.init();

  // setInsertCardDelay : if run on windows set it to 1000 or try more than 1000 if it error
  // For macOS, try a small delay to help with card detection
  reader.setInsertCardDelay(500); // Increased from 0 for better reliability
  // Increased timeout for macOS compatibility
  reader.setReadTimeout(15); // Increased from 10

  reader.onReadComplete((data) => {
    console.log("Card data read:", data);

    // Transform data to match the desired patient data structure
    const patientData = {
      mode: "readsmartcard",
      Citizenid: data.citizenID || "",
      Th_Firstname: data.firstNameTH || "",
      Th_Middlename: null, // Thai ID cards don't typically have middle names
      Th_Lastname: data.lastNameTH || "",
      Th_Prefix: data.titleTH || "",
      Birthday: data.dateOfBirth ? data.dateOfBirth.replace(/-/g, "/") : "",
      Sex: data.gender === "male" ? 1 : 2, // 1 = Male, 2 = Female
      Address: data.address || "",
      addrHouseNo: extractHouseNumber(data.address || ""),
      addrVillageNo: extractVillageNumber(data.address || ""),
      addrTambol: extractTambol(data.address || ""),
      addrAmphur: extractAmphur(data.address || ""),
      PhotoRaw: data.photoAsBase64Uri
        ? data.photoAsBase64Uri.replace("data:image/jpeg;base64,", "")
        : "",
    };

    console.log("Sending patient data:", patientData);
    // Send patient data directly (not wrapped in a message object)
    ws.send(JSON.stringify(patientData));
  });

  reader.onReadError((error) => {
    console.log("Card read error:", error);
    // Send error in the format expected by client
    ws.send(
      JSON.stringify({
        error: error,
      })
    );
  });

  ws.on("message", function message(data) {
    const sanitizedData = MessageValidator.sanitizeString(data.toString());
    console.log("Received:", sanitizedData);

    // First try MEDHIS-style validation for backward compatibility
    const medisValidation = MessageValidator.validateMedisMessage(sanitizedData);
    if (medisValidation.isValid && medisValidation.message) {
      if (medisValidation.message.mode === 'readsmartcard') {
        console.log("MEDHIS readsmartcard mode activated");
        ws.send(
          JSON.stringify({
            message: "Card reader is ready. Please insert card.",
          })
        );
        return;
      }
    }

    // Try standard WebSocket message validation
    const validation = MessageValidator.validateWebSocketMessage(sanitizedData);
    
    if (validation.isValid && validation.message) {
      const message = validation.message;

      switch (message.type) {
        case "startReading":
          console.log("Starting card reading...");
          // Card reader is already initialized and listening
          ws.send(
            JSON.stringify({
              message: "Card reader is ready. Please insert card.",
            })
          );
          break;

        case "stopReading":
          console.log("Stopping card reading...");
          // You might want to implement a stop method in ThaiIDCardReader
          ws.send(
            JSON.stringify({
              message: "Card reading stopped.",
            })
          );
          break;

        default:
          ws.send(
            JSON.stringify({
              error: "Unknown message type",
            })
          );
      }
    } else {
      console.warn("Invalid message received:", validation.error);
      ws.send(
        JSON.stringify({
          error: validation.error || "Invalid JSON message",
        })
      );
    }
  });

  ws.on("close", function close() {
    console.log("Client disconnected");
  });
});
