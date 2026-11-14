# Employee Card

Excel se employees import karo, har employee ki photo lagao, aur employee card (front + back) generate/print karo.

## Setup
Node.js 22.5+ chahiye (database ke liye built-in `node:sqlite` use hota hai).

```
npm install
npm start
```
Phir browser mein kholo: http://localhost:3000

## Excel format
Columns: `ID`, `Name`, `Designation`, `Residential Address`, `CNIC No`
Sample: `employees-sample.xlsx` (app mein "Sample Excel download" button bhi hai).
Designation / address ko 2 lines mein todne ke liye `|` lagao, e.g. `Associate Vice President | Software Development`.

## Data kahan save hota hai
- Database: `data/employees.db`
- Photos: `uploads/photos/`
