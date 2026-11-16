# Employee Card

Import employees from Excel, add a photo for each employee, and generate / print employee ID cards (front + back).

## Setup
Requires Node.js 22.5+ (the database uses the built-in `node:sqlite` module).

```
npm install
npm start
```
Then open http://localhost:3000 in the browser.

## Excel format
Columns: `ID`, `Name`, `Designation`, `Residential Address`, `CNIC No`
Sample: `employees-sample.xlsx` (the app also has a "Sample Excel download" button).
Use `|` to split designation / address onto 2 lines, e.g. `Associate Vice President | Software Development`.

## Where data is stored
- Database: `data/employees.db`
- Photos: `uploads/photos/`
