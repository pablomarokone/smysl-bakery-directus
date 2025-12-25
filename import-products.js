const fs = require('fs');
const axios = require('axios');

const API_URL = 'http://localhost:8055'; // Замените на свой адрес Directus
const ADMIN_EMAIL = 'pablomarokone@gmail.com'; // Замените на свой email
const ADMIN_PASSWORD = 'gochacat1987S'; // Замените на свой пароль
const IMPORT_FILE = './products-import.json';
const COLLECTION = 'products';

async function login() {
  const res = await axios.post(`${API_URL}/auth/login`, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  return res.data.data.access_token;
}

async function importItems(token, items) {
  for (const item of items) {
    try {
      await axios.post(
        `${API_URL}/items/${COLLECTION}`,
        item,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(`Импортирован: ${item.title}`);
    } catch (e) {
      console.log(`Ошибка при импорте ${item.title}:`, e.response?.data?.errors || e.message);
    }
  }
}

async function main() {
  const items = JSON.parse(fs.readFileSync(IMPORT_FILE, 'utf-8'));
  const token = await login();
  await importItems(token, items);
  console.log('Импорт завершён!');
}

main().catch(console.error);
