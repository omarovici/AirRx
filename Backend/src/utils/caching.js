import { createClient } from "redis";

const client = createClient(); 

export const init = async () => {
  if (!client.isOpen) {
    await client.connect();
    console.log("✅ Redis connected");
  }
};

export const cacheGet = async (key) => {
  const data = await client.get(key);
  if (data) {
    await client.expire(key, 300); 
    return JSON.parse(data);
  }
  return null;
};

export const cacheSet = async (key, value) => {
  await client.setEx(key, 300, JSON.stringify(value));
};

export const cacheClear = async () => {
  await client.flushDb();
};
