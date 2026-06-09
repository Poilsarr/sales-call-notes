import { config } from 'dotenv';
import OpenAI from 'openai';

config({ path: '.env.local' });

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    console.log('❌ OpenAI: failed - OPENAI_API_KEY is not set');
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey });

  try {
    const models = await openai.models.list();
    const count = models.data.length;
    console.log(`✅ OpenAI: connected (${count} models available)`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`❌ OpenAI: failed - ${message}`);
    process.exit(1);
  }
}

main();
