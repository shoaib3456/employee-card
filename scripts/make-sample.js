// Generates public/sample/employees-sample.xlsx with dummy employees
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

const rows = [
  { 'ID': 185, 'Name': 'Fasih Uddin', 'Designation': 'Associate Vice President | Software Development', 'Residential Address': 'B- 230, Block 10, | Gulshan-e-Iqbal, Karachi', 'CNIC No': '42201-1655997-9' },
  { 'ID': 186, 'Name': 'Ayesha Khan', 'Designation': 'Senior Software Engineer | Software Development', 'Residential Address': 'Flat 12, Al-Noor Heights, | Block 13-D, Gulshan-e-Iqbal, Karachi', 'CNIC No': '42101-2345678-2' },
  { 'ID': 187, 'Name': 'Muhammad Ali', 'Designation': 'HR Manager | Human Resources', 'Residential Address': 'House 45, Street 7, | DHA Phase 6, Karachi', 'CNIC No': '42301-3456789-1' },
  { 'ID': 188, 'Name': 'Sara Ahmed', 'Designation': 'QA Engineer | Quality Assurance', 'Residential Address': 'A-12, Block 5, | Clifton, Karachi', 'CNIC No': '42201-4567890-4' },
  { 'ID': 189, 'Name': 'Hamza Siddiqui', 'Designation': 'Network Administrator | IT Infrastructure', 'Residential Address': 'R-221, Sector 11-A, | North Karachi, Karachi', 'CNIC No': '42401-5678901-3' },
];

const ws = XLSX.utils.json_to_sheet(rows);
ws['!cols'] = [{ wch: 6 }, { wch: 20 }, { wch: 48 }, { wch: 55 }, { wch: 18 }];
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Employees');

const out = path.join(__dirname, '..', 'public', 'sample', 'employees-sample.xlsx');
fs.mkdirSync(path.dirname(out), { recursive: true });
XLSX.writeFile(wb, out);
console.log('Sample written:', out);
