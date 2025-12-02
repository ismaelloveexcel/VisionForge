import fs from "fs/promises";
import path from "path";

const MEMORY_DIR = path.join(process.cwd(), ".ai-dan-memory");

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

interface ConversationData {
  userId: string;
  messages: ChatMessage[];
  updatedAt: string;
}

async function ensureMemoryDir() {
  try {
    await fs.mkdir(MEMORY_DIR, { recursive: true });
  } catch {}
}

function getFilePath(userId: string): string {
  const safeId = userId.replace(/[^a-zA-Z0-9-_]/g, "_");
  return path.join(MEMORY_DIR, `${safeId}.json`);
}

export async function saveChat(userId: string, messages: ChatMessage[]): Promise<void> {
  await ensureMemoryDir();
  
  const data: ConversationData = {
    userId,
    messages,
    updatedAt: new Date().toISOString()
  };
  
  await fs.writeFile(getFilePath(userId), JSON.stringify(data, null, 2), "utf-8");
}

export async function loadChat(userId: string): Promise<ChatMessage[]> {
  await ensureMemoryDir();
  
  try {
    const content = await fs.readFile(getFilePath(userId), "utf-8");
    const data: ConversationData = JSON.parse(content);
    return data.messages || [];
  } catch {
    return [];
  }
}

export async function clearChat(userId: string): Promise<void> {
  try {
    await fs.unlink(getFilePath(userId));
  } catch {}
}

export async function appendToChat(userId: string, message: ChatMessage): Promise<void> {
  const existing = await loadChat(userId);
  existing.push(message);
  await saveChat(userId, existing);
}
