import { Environment, Paddle as PaddleSDK } from "@paddle/paddle-node-sdk";
import { getSecret } from "@/lib/secrets";

let paddleClient: PaddleSDK | null = null;

export function getPaddleClient(): PaddleSDK {
  if (!paddleClient) {
    const apiKey = getSecret("PADDLE_API_KEY");
    if (!apiKey) {
      throw new Error("PADDLE_API_KEY is not set");
    }
    paddleClient = new PaddleSDK(apiKey, {
      environment: process.env.NODE_ENV === "production" ? Environment.production : Environment.sandbox,
    });
  }
  return paddleClient;
}

export const PADDLE_CLIENT_TOKEN = getSecret("NEXT_PUBLIC_PADDLE_CLIENT_KEY") || "";
