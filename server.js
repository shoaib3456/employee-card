const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

const uploadsDir = path.join(__dirname, 'uploads', 'photos');
fs.mkdirSync(uploadsDir, { recursive: true });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Excel upload is kept in memory; photos go straight to uploads/photos
const excelUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const photoUpload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const safeId = String(req.params.id).replace(/[^a-zA-Z0-9_-]/g, '_');
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${safeId}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype));
  },
});

// Map messy Excel headers ("CNIC No", "Residential Address", "Emp ID"...) to our columns
const HEADER_MAP = {
  id: ['id', 'empid', 'employeeid', 'empno', 'employeeno'],
  name: ['name', 'employeename', 'fullname'],
  designation: ['designation', 'title', 'post', 'position'],
  address: ['residentialaddress', 'residentaladdress', 'residentialaddres', 'address'],
  cnic: ['cnicno', 'cnic', 'cnicnumber', 'nic'],
};

function normalizeRow(row) {
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    const k = key.toLowerCase().replace(/[^a-z]/g, '');
    for (const [field, aliases] of Object.entries(HEADER_MAP)) {
      if (aliases.includes(k) && out[field] === undefined) out[field] = String(value).trim();
    }
  }
  return out;
}

app.post('/api/import', excelUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Excel file select karein' });

  let rows;
  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
  } catch (e) {
    return res.status(400).json({ error: 'File parh nahi saki: ' + e.message });
  }

  // Upsert keeps an existing photo when the same ID is imported again
  const upsert = db.prepare(`
    INSERT INTO employees (id, name, designation, address, cnic)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name, designation = excluded.designation,
      address = excluded.address, cnic = excluded.cnic,
      updated_at = datetime('now')
  `);

  let imported = 0;
  const skipped = [];
  db.exec('BEGIN');
  try {
    rows.forEach((raw, i) => {
      const r = normalizeRow(raw);
      if (!r.id || !r.name) {
        skipped.push(i + 2); // +2 = header row + 1-based
        return;
      }
      upsert.run(r.id, r.name, r.designation || '', r.address || '', r.cnic || '');
      imported++;
    });
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    return res.status(500).json({ error: e.message });
  }

  res.json({ imported, skipped });
});

app.get('/api/employees', (req, res) => {
  res.json(db.prepare('SELECT * FROM employees ORDER BY CAST(id AS INTEGER), id').all());
});

app.get('/api/employees/:id', (req, res) => {
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!emp) return res.status(404).json({ error: 'Employee nahi mila' });
  res.json(emp);
});

app.post('/api/employees/:id/photo', (req, res) => {
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!emp) return res.status(404).json({ error: 'Employee nahi mila' });

  photoUpload.single('photo')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Sirf image (jpg/png/webp) allowed hai' });

    if (emp.photo) fs.rm(path.join(__dirname, emp.photo), { force: true }, () => {});
    const photo = `uploads/photos/${req.file.filename}`;
    db.prepare(`UPDATE employees SET photo = ?, updated_at = datetime('now') WHERE id = ?`).run(photo, emp.id);
    res.json({ photo });
  });
});

app.delete('/api/employees/:id', (req, res) => {
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!emp) return res.status(404).json({ error: 'Employee nahi mila' });
  if (emp.photo) fs.rm(path.join(__dirname, emp.photo), { force: true }, () => {});
  db.prepare('DELETE FROM employees WHERE id = ?').run(emp.id);
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Employee Card app: http://localhost:${PORT}`));
