const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const API_URL = 'https://smysl-bakery-directus.onrender.com'; // Замените на свой адрес Directus
const ADMIN_EMAIL = 'pablomarokone@gmail.com'; // Замените на свой email
const ADMIN_PASSWORD = 'gochacat1987S'; // Замените на свой пароль
const IMG_DIR = './uploads'; // Путь к папке с файлами Directus

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


async function getExistingFileNames(token) {
  let allFiles = [];
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const res = await axios.get(`${API_URL}/files`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 100, page, fields: 'filename_download' }
    });
    const items = res.data.data;
    allFiles = allFiles.concat(items.map(f => f.filename_download));
    hasMore = items.length === 100;
    page++;
  }
  return new Set(allFiles);
}


function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


function getAllFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.lstatSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath));
    } else if (stat.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.png' || ext === '.svg' || ext === '.jpg' || ext === '.avif') {
        results.push(filePath);
      }
    }
  }
  return results;
}

async function main() {
  const token = await login();
  const existingFiles = await getExistingFileNames(token);
  const files = getAllFiles(IMG_DIR);
  const result = {};
  for (const filePath of files) {
    const fileName = path.basename(filePath);
    if (existingFiles.has(fileName)) {
      console.log(`${fileName} уже есть в Directus, пропускаем.`);
      continue;
    }
    try {
      const id = await uploadFile(token, filePath);
      result[fileName] = id;
      console.log(`${fileName} → ${id}`);
    } catch (e) {
      console.log(`Ошибка при загрузке ${fileName}:`, e.response?.data?.errors || e.message);
    }
    await delay(2000); // задержка 2 секунды между загрузками
  }
  fs.writeFileSync('directus-files-map.json', JSON.stringify(result, null, 2), 'utf-8');
  console.log('Готово! Соответствие файл → ID сохранено в directus-files-map.json');
}

main().catch(console.error);
