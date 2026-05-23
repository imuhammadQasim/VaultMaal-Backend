const Redis = require("ioredis");

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

let redisClient = null;
let isRedisConnected = false;

const createMockRedis = () => {
  console.warn(
    "⚠️ FALLING BACK TO MEMORY-BASED MOCK REDIS CLIENT (Only for dev/testing!)",
  );
  const store = {};
  return {
    get: async (key) => store[key] || null,
    set: async (key, val, mode, duration) => {
      store[key] = val;
      if (mode === "EX" && duration) {
        setTimeout(() => {
          delete store[key];
        }, duration * 1000);
      }
      return "OK";
    },
    del: async (key) => {
      const exists = store[key] !== undefined;
      delete store[key];
      return exists ? 1 : 0;
    },
    keys: async (pattern) => {
      const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
      return Object.keys(store).filter((key) => regex.test(key));
    },
    incr: async (key) => {
      const val = Number(store[key] || 0) + 1;
      store[key] = String(val);
      return val;
    },
    expire: async (key, seconds) => {
      if (store[key] !== undefined) {
        setTimeout(() => {
          delete store[key];
        }, seconds * 1000);
        return 1;
      }
      return 0;
    },
    status: "ready",
    on: () => {},
    quit: async () => "OK",
  };
};

const initRedis = async () => {
  return new Promise((resolve) => {
    try {
      console.log("🔄 Connecting to Redis...");

      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 3000,
      });

      redisClient.on("connect", () => {
        console.log(`✅ Redis Connected Successfully!`);
        isRedisConnected = true;
        resolve(redisClient);
      });

      redisClient.on("error", (err) => {
        console.error(`❌ Redis connection error: ${err.message}`);
        if (!isRedisConnected && !redisClient.isMock) {
          console.warn("⚡ Redis connection failed on startup.");
          redisClient = createMockRedis();
          redisClient.isMock = true;
          isRedisConnected = true;
          resolve(redisClient);
        }
      });
    } catch (err) {
      console.error(`❌ Redis Init Exception: ${err.message}`);
      redisClient = createMockRedis();
      redisClient.isMock = true;
      resolve(redisClient);
    }
  });
};

const getRedisClient = () => {
  if (!redisClient) {
    redisClient = createMockRedis();
    redisClient.isMock = true;
  }
  return redisClient;
};

module.exports = {
  initRedis,
  getRedisClient,
};
