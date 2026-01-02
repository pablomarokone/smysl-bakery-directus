// convert-to-sql.js
// Конвертер Directus snapshot.json в SQL для PostgreSQL (Supabase)
// Использование: node convert-to-sql.js путь_к_snapshot.json > schema.sql

const fs = require('fs');

if (process.argv.length < 3) {
  console.error('Укажите путь к snapshot.json');
  process.exit(1);
}

const path = process.argv[2];
const snapshot = JSON.parse(fs.readFileSync(path, 'utf-8'));

function pgType(field) {
  switch (field.type) {
    case 'integer': return 'INTEGER';
    case 'bigInteger': return 'BIGINT';
    case 'float': return 'REAL';
    case 'decimal': return 'DECIMAL';
    case 'boolean': return 'BOOLEAN';
    case 'dateTime': return 'TIMESTAMP';
    case 'date': return 'DATE';
    case 'time': return 'TIME';
    case 'json': return 'JSONB';
    case 'uuid': return 'UUID';
    case 'string':
    case 'text': return 'TEXT';
    default: return 'TEXT';
  }
}

function createTableSQL(collection, fields) {
  const lines = [`CREATE TABLE IF NOT EXISTS "${collection}" (`];
  const cols = [];
  for (const field of fields) {
    let col = `  "${field.field}" ${pgType(field)}`;
    if (field.primary) col += ' PRIMARY KEY';
    if (field.unique) col += ' UNIQUE';
    if (field.not_null) col += ' NOT NULL';
    cols.push(col);
  }
  lines.push(cols.join(',\n'));
  lines.push(');\n');
  return lines.join('\n');
}

// Собираем коллекции и поля
const collections = snapshot.data.collections || [];
const fields = snapshot.data.fields || [];

for (const col of collections) {
  const colFields = fields.filter(f => f.collection === col.collection);
  if (colFields.length === 0) continue;
  console.log(createTableSQL(col.collection, colFields));
}

console.log('-- После создания таблиц импортируйте этот SQL в Supabase через SQL Editor или psql');
