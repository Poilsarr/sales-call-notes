import { Environment, Paddle as PaddleSDK } from "@paddle/paddle-node-sdk";

let paddleClient: PaddleSDK | null = null;

export function getPaddleClient(): PaddleSDK {
  if (!paddleClient) {
    const apiKey = process.env.PADDLE_API_KEY;
    if (!apiKey) {
      throw new Error("PADDLE_API_KEY is not set");
    }
    paddleClient = new PaddleSDK(apiKey, {
      environment: process.env.NODE_ENV === "production" ? Environment.production : Environment.sandbox,
    });
  }
  return paddleClient;
}

export const PADDLE_CLIENT_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || "";
