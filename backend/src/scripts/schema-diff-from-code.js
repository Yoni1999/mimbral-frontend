'use strict';
const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const { sql, poolPromise } = require('../models/db');

const SCAN_DIRS = ['src', 'scripts']; 
const FILE_EXT = ['.js', '.ts', '.sql'];

// Tablas a analizar (de tu screenshot)
const TABLES = [
  'dbo.@Categoria','dbo.@FAMILIA','dbo.@PRIMER_NIVEL','dbo.@SUBCATEGORIA','dbo.@SUBFAMILIA',
  'dbo.CANALES_VENTA','dbo.DLN1','dbo.imag','dbo.INV1','dbo.ITM1','dbo.ITM1_ListPrice',
  'dbo.METAS_PRODUCTO_CANAL','dbo.OBNK','dbo.OCRD','dbo.OCRG','dbo.ODLN','dbo.OINM','dbo.OINV',
  'dbo.OITB','dbo.OITM','dbo.OITM_Products','dbo.OITW','dbo.OMRC','dbo.OPCH','dbo.OPDN',
  'dbo.OPLN','dbo.OPOR','dbo.ORCT','dbo.ORIN','dbo.ORPC','dbo.OSCN','dbo.OSLP','dbo.OTP_CODES',
  'dbo.OWTR','dbo.PCH1','dbo.PDN1','dbo.PERIODOS_METAS','dbo.POR1','dbo.RIN1','dbo.RPC1',
  'dbo.SESIONES_USUARIOS','dbo.SUGERENCIAS_USUARIOS','dbo.TOKENS_ACTIVOS','dbo.USUARIOS','dbo.VENDEDORES'
];

// Heurística rápida de tipos por nombre de columna
function guessTypeByName(col) {
  const c = col.toLowerCase();
  if (/(^id$|_id$|id_)/.test(c)) return 'int';
  if (/(fecha|date|created|updated|timestamp)/.test(c)) return 'datetime';
  if (/(total|monto|precio|costo|amount|importe)/.test(c)) return 'decimal';
  if (/(activo|enabled|is_|flag|bool)/.test(c)) return 'bit';
  if (/(email|correo|telefono|phone|rut|code|name|descripcion|nota|coment)/.test(c)) return 'nvarchar';
  return 'unknown';
}

function normTableName(raw) {
  const t = raw.replace(/\s+/g, '');
  if (t.includes('.')) {
    return t.replace(/\[/g,'').replace(/\]/g,'').replace(/`/g,'');
  }
  return `dbo.${t.replace(/\[|\]|`/g,'')}`;
}

// Regex
const reFrom = /\bfrom\s+([[\]\w.@]+)(?:\s+as)?\s+([A-Za-z_][\w]*)?|\bfrom\s+([[\]\w.@]+)/ig;
const reJoin = /\bjoin\s+([[\]\w.@]+)(?:\s+as)?\s+([A-Za-z_][\w]*)?|\bjoin\s+([[\]\w.@]+)/ig;
const reSelectCols = /\bselect\s+([\s\S]+?)\bfrom\b/ig;
const reInsertCols = /\binsert\s+into\s+([[\]\w.@]+)\s*\(([^)]+)\)/ig;
const reUpdateSet  = /\bupdate\s+([[\]\w.@]+)\s+set\s+([\s\S]+?)\b(where|;|$)/ig;
const reColumnRef  = /(?:^|[\s,(])([A-Za-z_][\w]*)\.([A-Za-z_@][\w@]*)/g;
const reParamInput = /\.input\(\s*['"]([\w@]+)['"]\s*,\s*sql\.([A-Za-z]+)\s*,/g;
const reWhereParam = /([A-Za-z_][\w]*)\.([A-Za-z_][\w]*)\s*=\s*@([\w@]+)/g;

function buildParamTypeMap(fileText) {
  const map = {};
  let m;
  while ((m = reParamInput.exec(fileText)) !== null) {
    map[m[1]] = m[2];
  }
  return map;
}

function extractUsageFromSql(sqlText, trackedTables) {
  const usage = {};
  const alias2table = {};

  let m;
  // FROM
  while ((m = reFrom.exec(sqlText)) !== null) {
    const raw = m[1] || m[3];
    const alias = m[2] || null;
    if (!raw) continue;
    const t = normTableName(raw);
    if (trackedTables.includes(t)) {
      if (alias) alias2table[alias] = t;
      usage[t] = usage[t] || new Set();
    }
  }

  // JOIN
  while ((m = reJoin.exec(sqlText)) !== null) {
    const raw = m[1] || m[3];
    const alias = m[2] || null;
    if (!raw) continue;
    const t = normTableName(raw);
    if (trackedTables.includes(t)) {
      if (alias) alias2table[alias] = t;
      usage[t] = usage[t] || new Set();
    }
  }

  // SELECT
  while ((m = reSelectCols.exec(sqlText)) !== null) {
    const selectPart = m[1];
    let c;
    while ((c = reColumnRef.exec(selectPart)) !== null) {
      const qAlias = c[1], qCol = c[2];
      const table = alias2table[qAlias] || (trackedTables.includes(normTableName(qAlias)) ? normTableName(qAlias) : null);
      if (!table) continue;
      if (/^\*/.test(qCol)) continue;
      usage[table] = usage[table] || new Set();
      usage[table].add(qCol.replace(/^\[/,'').replace(/\]$/,''));
    }
  }

  // INSERT
  while ((m = reInsertCols.exec(sqlText)) !== null) {
    const rawTable = normTableName(m[1]);
    if (!trackedTables.includes(rawTable)) continue;
    usage[rawTable] = usage[rawTable] || new Set();
    const cols = m[2].split(',').map(s => s.trim().replace(/\[|\]/g,''));
    cols.forEach(c => usage[rawTable].add(c));
  }

  // UPDATE
  while ((m = reUpdateSet.exec(sqlText)) !== null) {
    const rawTable = normTableName(m[1]);
    if (!trackedTables.includes(rawTable)) continue;
    usage[rawTable] = usage[rawTable] || new Set();
    const setPart = m[2];
    const assigns = setPart.split(',');
    assigns.forEach(a => {
      const mm = a.split('=');
      if (mm[0]) {
        const col = mm[0].trim().replace(/^.+\./,'').replace(/\[|\]/g,'');
        usage[rawTable].add(col);
      }
    });
  }

  // WHERE con @param
  const whereAliasCols = [];
  while ((m = reWhereParam.exec(sqlText)) !== null) {
    const alias = m[1], col = m[2];
    const table = alias2table[alias] || (trackedTables.includes(normTableName(alias)) ? normTableName(alias) : null);
    if (!table) continue;
    usage[table] = usage[table] || new Set();
    usage[table].add(col);
    whereAliasCols.push({ table, col, param: m[3] });
  }

  return { usage, whereAliasCols };
}

async function scanProject() {
  const patterns = SCAN_DIRS.map(d => `${d.replace(/\\/g,'/')}/**/*.{js,ts,sql}`);
  const files = (await glob(patterns, { nodir: true })).filter(f => FILE_EXT.includes(path.extname(f)));
  const expected = {};
  for (const t of TABLES) expected[t] = { cols: new Set(), types: new Map() };

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const paramTypeMap = buildParamTypeMap(text);
    const { usage, whereAliasCols } = extractUsageFromSql(text, TABLES);

    for (const [table, set] of Object.entries(usage)) {
      set.forEach(c => expected[table].cols.add(c));
    }

    for (const w of whereAliasCols) {
      const t = paramTypeMap[w.param];
      if (t) {
        const base = String(t).toLowerCase();
        const map = {
          int: 'int', bigint: 'bigint', smallint: 'smallint', tinyint: 'tinyint',
          bit: 'bit', decimal: 'decimal', numeric: 'decimal', money: 'money',
          float: 'float', real: 'real',
          date: 'date', datetime: 'datetime', datetime2: 'datetime2', smalldatetime: 'smalldatetime', time: 'time',
          nvarchar: 'nvarchar', varchar: 'varchar', nchar: 'nchar', char: 'char', text: 'text', ntext: 'ntext',
          uniqueidentifier: 'uniqueidentifier'
        };
        const sqlType = map[base] || base;
        expected[w.table].types.set(w.col, sqlType);
      }
    }
  }

  for (const [table, obj] of Object.entries(expected)) {
    for (const col of obj.cols) {
      if (!obj.types.has(col)) {
        obj.types.set(col, guessTypeByName(col));
      }
    }
  }

  return expected;
}

async function readDbColumns() {
  const pool = await poolPromise;
  const { recordset } = await pool.request().query(`
    SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, DATA_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS;
  `);
  const db = {};
  for (const r of recordset) {
    const key = `${r.TABLE_SCHEMA}.${r.TABLE_NAME}`;
    db[key] = db[key] || new Set();
    db[key].add(r.COLUMN_NAME);
  }
  return db;
}

(async () => {
  try {
    const expected = await scanProject();
    const dbCols = await readDbColumns();

    const missing = [];
    for (const [table, { cols, types }] of Object.entries(expected)) {
      const realSet = dbCols[table] || new Set();
      for (const col of cols) {
        if (!realSet.has(col)) {
          missing.push({
            table,
            column: col,
            expectedType: types.get(col) || 'unknown'
          });
        }
      }
    }

    if (missing.length === 0) {
      console.log('✅ No faltan columnas: lo que usa el backend existe en la BD.');
    } else {
      console.log('❗Columnas que usa el backend y NO existen en la BD:');
      for (const m of missing) {
        console.log(` - ${m.table}.${m.column}  (tipo esperado: ${m.expectedType})`);
      }

      const csvPath = path.join(process.cwd(), 'schema_missing_columns.csv');
      const csv = ['table,column,expected_type'].concat(
        missing.map(m => `${m.table},${m.column},${m.expectedType}`)
      ).join('\n');
      fs.writeFileSync(csvPath, csv, 'utf8');
      console.log(`\n📄 CSV generado: ${csvPath}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  } finally {
    try {
      const pool = await poolPromise;
      pool.close();
    } catch (e) {}
  }
})();
