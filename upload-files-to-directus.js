const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const API_URL = 'http://localhost:8055'; // Замените на свой адрес Directus
const ADMIN_EMAIL = 'pablomarokone@gmail.com'; // Замените на свой email
const ADMIN_PASSWORD = 'gochacat1987S'; // Замените на свой пароль
const IMG_DIR = '../smysl-bakery/public/img'; // Путь к папке с изображениями

async function login() {
  const res = await axios.post(`${API_URL}/auth/login`, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  return res.data.data.access_token;
}

async function uploadFile(token, filePath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  const res = await axios.post(`${API_URL}/files`, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data.data.id;
}

async function main() {
  const token = await login();
  const files = fs.readdirSync(IMG_DIR);
  const result = {};
  for (const file of files) {
    const filePath = path.join(IMG_DIR, file);
    if (fs.lstatSync(filePath).isFile()) {
      try {
        const id = await uploadFile(token, filePath);
        result[file] = id;
        console.log(`${file} → ${id}`);
      } catch (e) {
        console.log(`Ошибка при загрузке ${file}:`, e.response?.data?.errors || e.message);
      }
    }
  }
  fs.writeFileSync('directus-files-map.json', JSON.stringify(result, null, 2), 'utf-8');
  console.log('Готово! Соответствие файл → ID сохранено в directus-files-map.json');
}

main().catch(console.error);
