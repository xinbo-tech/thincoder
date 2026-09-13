# xlsx-create — generate Excel spreadsheets

## When to Use
When the user asks for a spreadsheet, data export, table, or CSV→xlsx conversion.

## Workflow
1. Generate the data as CSV (comma-separated, UTF-8 with BOM for Excel compatibility on Windows)
2. Use PowerShell to convert CSV to xlsx (available on all Windows machines):

```powershell
$csv = Import-Csv -Path "data.csv" -Encoding UTF8
$csv | Export-Excel -Path "output.xlsx" -AutoSize -TableName "Data"
```

If `ImportExcel` module is not installed, install it first:
```powershell
Install-Module -Name ImportExcel -Force -Scope CurrentUser
```

Or for simple tables without external modules:
```powershell
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$wb = $excel.Workbooks.Add()
$ws = $wb.Worksheets.Item(1)
# ... populate cells ...
$wb.SaveAs("$pwd\output.xlsx", 51)  # 51 = xlOpenXMLWorkbook
$excel.Quit()
```

## Alternative (cross-platform)
If Python is available:
```bash
python3 -c "
import csv, openpyxl
wb = openpyxl.Workbook()
ws = wb.active
with open('data.csv') as f:
    for row in csv.reader(f):
        ws.append(row)
wb.save('output.xlsx')
"
```

## Rules
- CSV is the intermediate format — always UTF-8 with BOM (`\uFEFF`) for Excel
- Clean up the intermediate CSV file after conversion
- If the user wants formatting (colors, merged cells, formulas), use the COM approach on Windows
