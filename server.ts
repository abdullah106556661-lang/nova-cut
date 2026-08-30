import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { authRouter } from "./server/routes/authRoutes";
import { adminRouter } from "./server/routes/adminRoutes";
import { projectRouter } from "./server/routes/projectRoutes";
import { paymentRouter } from "./server/routes/paymentRoutes";
import { aiRouter, getAIClient, generateContentWithResilience } from "./server/routes/aiRoutes";
import { authenticateMiddleware, AuthenticatedRequest } from "./server/auth";

dotenv.config();

// Global process exception guards to prevent connection drops
process.on("uncaughtException", (err) => {
  console.error("[CRITICAL] Uncaught Exception trapped:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[CRITICAL] Unhandled Rejection trapped at:", promise, "reason:", reason);
});

const app = express();
const PORT = 3000;

// Security & Body Parsing Middlewares
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Security Headers Middleware
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Server-wide authentication context middleware
app.use(authenticateMiddleware);

// Healthcheck endpoint
app.get("/api/health", (_req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: "ok",
    appName: "NovaCut AI Video Studio",
    hasApiKey: hasKey,
    environment: process.env.VERCEL ? "vercel" : "cloud-run",
    timestamp: new Date().toISOString(),
  });
});

// Mount modular sub-routers
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/projects", projectRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/ai", aiRouter);

// Support & Contact endpoint
app.post("/api/support/contact", (req, res) => {
  try {
    const { name, email, subject = "General Inquiry", message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required." });
    }

    const supportEmail = process.env.SUPERADMIN_EMAIL || "support@novacut.io";
    const ticketId = `TICK-${Date.now().toString().slice(-6)}`;

    console.log(`[Support Ticket ${ticketId}] From: ${name} <${email}> -> To: ${supportEmail} | Subj: ${subject}`);

    res.json({
      success: true,
      ticketId,
      message: `Your message has been received! Our support team will review and respond to ${email} within 24 business hours.`,
      recipient: supportEmail,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Contact API Error:", error);
    res.status(500).json({ error: "Failed to submit message." });
  }
});

// 1. Text & Structured Generation Endpoint (Urdu & English)
app.post("/api/gemini/generate", async (req: AuthenticatedRequest, res) => {
  try {
    const {
      prompt,
      systemInstruction,
      temperature = 0.7,
      searchGrounding = false,
      model = "gemini-3.7-flash",
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        error: "AI generation is temporarily unavailable. Please check the Gemini API configuration.",
      });
    }

    const config: any = {};
    if (systemInstruction) config.systemInstruction = systemInstruction;
    if (temperature !== undefined) config.temperature = Number(temperature);
    if (searchGrounding) config.tools = [{ googleSearch: {} }];

    const response = await generateContentWithResilience(ai, {
      model,
      contents: prompt,
      config,
    });

    const text = response.text || "No response generated.";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    res.json({ text, groundingChunks });
  } catch (error: any) {
    console.error("Gemini Generate Error:", error);
    res.status(500).json({
      error: error?.message || "Failed to generate AI response. Please verify your prompt and try again.",
    });
  }
});

// 2. Chat Endpoint (Urdu & English)
app.post("/api/gemini/chat", async (req: AuthenticatedRequest, res) => {
  try {
    const {
      messages = [],
      systemInstruction = "You are NovaCut Studio's AI Creative Assistant. You are fluent in both English and Urdu (اردو). You give concise, expert video editing, visual effects, and prompt guidance.",
      model = "gemini-3.7-flash",
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        error: "AI Copilot is temporarily unavailable. Please check the Gemini API configuration.",
      });
    }

    const contents = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const response = await generateContentWithResilience(ai, {
      model,
      contents,
      config: {
        systemInstruction,
      },
    });

    const text = response.text || "No response generated.";
    res.json({ text });
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    res.status(500).json({
      error: error?.message || "AI Chat service encountered an error. Please try again.",
    });
  }
});

// 3. Vision & Image Analysis Endpoint
app.post("/api/gemini/analyze-image", async (req: AuthenticatedRequest, res) => {
  try {
    const {
      imageBase64,
      mimeType = "image/png",
      prompt = "Analyze this image in detail.",
      model = "gemini-3.7-flash",
    } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Image base64 data is required" });
    }

    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        error: "AI Vision analysis is temporarily unavailable. Please check the Gemini API configuration.",
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const imagePart = {
      inlineData: {
        mimeType,
        data: cleanBase64,
      },
    };
    const textPart = { text: prompt };

    const response = await generateContentWithResilience(ai, {
      model,
      contents: { parts: [imagePart, textPart] },
    });

    const text = response.text || "No analysis provided.";
    res.json({ text });
  } catch (error: any) {
    console.error("Gemini Vision Error:", error);
    res.status(500).json({
      error: error?.message || "Failed to analyze image with AI vision.",
    });
  }
});

// Start server function handling Vite integration, static assets, and HTTP listener
async function startServer() {
  try {
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (_req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    // Express global error handler middleware (mounted after all routes and vite)
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error("Global Express Error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: err?.message || "Internal server error" });
      }
    });

    if (!process.env.VERCEL) {
      const server = app.listen(PORT, "0.0.0.0", () => {
        console.log(`NovaCut AI Video Studio server listening on http://0.0.0.0:${PORT}`);
      });

      server.on("error", (err: any) => {
        console.error("Server Socket Error:", err);
      });
    }
  } catch (initErr) {
    console.error("Server Initialization Failed:", initErr);
  }
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
