const fs = require('fs');
const axios = require('axios');

const API_URL = 'http://localhost:8055'; // Замените на свой адрес Directus
const ADMIN_EMAIL = 'pablomarokone@gmail.com'; // Замените на свой email
const ADMIN_PASSWORD = 'gochacat1987S'; // Замените на свой пароль
const IMPORT_FILE = './directus-collections-import-ru-files.json';

async function login() {
  const res = await axios.post(`${API_URL}/auth/login`, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  return res.data.data.access_token;
}

async function createCollection(token, collection) {
  await axios.post(
    `${API_URL}/collections`,
    {
      collection: collection.collection,
      meta: collection.meta || {},
      schema: collection.schema || {},
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
}


async function upsertField(token, collection, field) {
  try {
    // Пробуем создать поле
    await axios.post(
      `${API_URL}/fields/${collection}`,
      field,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`  Поле ${field.field} создано в ${collection}`);
  } catch (e) {
    // Если поле уже существует, обновляем его
    if (e.response && e.response.status === 400 && e.response.data.errors && e.response.data.errors[0].extensions.code === 'FIELD_ALREADY_EXISTS') {
      await axios.patch(
        `${API_URL}/fields/${collection}/${field.field}`,
        field,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(`  Поле ${field.field} обновлено в ${collection}`);
    } else {
      console.log(`  Ошибка при создании/обновлении поля ${field.field} в ${collection}:`, e.response?.data?.errors || e.message);
    }
  }
}

async function main() {
  const data = JSON.parse(fs.readFileSync(IMPORT_FILE, 'utf-8'));
  const token = await login();

  for (const col of data.collections) {
    try {
      await createCollection(token, col);
      console.log(`Коллекция ${col.collection} создана`);
    } catch (e) {
      console.log(`Коллекция ${col.collection} уже существует или ошибка:`, e.response?.data?.errors || e.message);
    }
    for (const field of col.fields) {
      await upsertField(token, col.collection, field);
    }
  }
}

main().catch(console.error);
