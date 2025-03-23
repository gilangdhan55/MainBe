import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
  retryStrategy: (times) => {
    const delay = Math.min(times * 100, 3000); // Coba reconnect dengan delay max 3 detik
    console.log(`🔄 Reconnecting to Redis in ${delay} ms...`);
    return delay;
  },
  reconnectOnError: (err) => {
    console.error("❌ Redis Error:", err);
    return true; // Coba reconnect kalau ada error
  },
});

redis.on("connect", () => console.log("✅ Connected to Redis"));
redis.on("error", (err) => console.error("❌ Redis error:", err));
redis.on("end", () => console.log("⚠️ Redis disconnected. Trying to reconnect..."));

export default redis;
