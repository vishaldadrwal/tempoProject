import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '../../database.json');

const initializeDB = async () => {
  try {
    await fs.access(DB_PATH);
  } catch {
    const initialData = { users: [], tasks: [] };
    await fs.writeFile(DB_PATH, JSON.stringify(initialData, null, 2));
    console.log('📦 Local JSON database created!');
  }
};

const getData = async () => {
  const content = await fs.readFile(DB_PATH, 'utf-8');
  return JSON.parse(content);
};

const saveData = async (data) => {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
};

export { initializeDB, getData, saveData };
