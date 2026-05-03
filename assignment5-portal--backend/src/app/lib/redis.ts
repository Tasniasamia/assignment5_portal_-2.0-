import { createClient, type RedisClientType } from "redis";
import { envVars } from "../../config/env";

class RedisService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;
  async connect(): Promise<void> {
    try {
      this.client = createClient({ url: envVars.REDIS_URL });
      this.client.on("error", (err) => {
        console.error("Redis Client Error", err);
        this.isConnected = false;
      });
      this.client.on("connect", () => {
        console.log("Connected to Redis");
        this.isConnected = true;
      });
      this.client.on("ready", () => {
        console.log("Redis is ready");
        this.isConnected = true;
      });
      this.client.on("end", () => {
        console.log("Redis connection closed");
        this.isConnected = false;
      });
      this.client.on("reconnecting", () => {
        console.log("Reconnecting to Redis...");
      });
      await this.client.connect();
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      this.isConnected = false;
    }
  }
  private ensureConnected(): RedisClientType {
    if (!this.client) {
      throw new Error(
        "Redis client is not initialized. Attempting to connect...",
      );
    }
    if (!this.isConnected) {
      throw new Error(
        "Redis client is not connected. Attempting to reconnect...",
      );
    }

    return this.client;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  async set(key: string, value: string, expiry: number): Promise<void> {
    try {
      if (!this.client || !this.isConnected) {
        console.warn("Redis client is not connected. Attempting to connect...");
        await this.connect();
      }
      const client = this.ensureConnected();

      await client.set(key, value, { EX: expiry });
    } catch (error) {
      console.error("Failed to set key in Redis:", error);
    }
  }
  async get(key: string): Promise<string | null> {
    try {
      if (!this.client || !this.isConnected) {
        console.warn("Redis client is not connected. Attempting to connect...");
        await this.connect();
      }
      const client = this.ensureConnected();
      return await client.get(key);
    } catch (error) {
      console.error("Failed to get key from Redis:", error);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      if (!this.client || !this.isConnected) {
        console.warn("Redis client is not connected. Attempting to connect...");
        await this.connect();
      }
      const client = this.ensureConnected();
      await client.del(key);
    } catch (error) {
      console.error("Failed to delete key from Redis:", error);
    }
  }

  async updateExpiry(key: string, expiry: number): Promise<void> {
    try {
      if (!this.client || !this.isConnected) {
        console.warn("Redis client is not connected. Attempting to connect...");
        await this.connect();
      }
      const client = this.ensureConnected();
      await this.set(key, (await client.get(key)) ?? "", expiry);
    } catch (error) {
      console.error("Failed to update  key expiry in Redis:", error);
    }
  }
}

export const redisService = new RedisService();
