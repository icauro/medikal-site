import pdfplumber
import csv

pdf = pdfplumber.open(r'c:\Users\Admin\Downloads\muayenehanelerpdf.pdf')
total = 0
for i, page in enumerate(pdf.pages):
    tables = page.extract_tables()
    for table in tables:
        for row in table:
            if row and row[0] and str(row[0]).strip().isdigit():
                total += 1
                
print(f'Total entries with numeric IDs in PDF: {total}')

# Count in CSV
with open(r'c:\Users\Admin\Desktop\pdf to csv\output.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    next(reader)  # skip header
    csv_count = sum(1 for row in reader)
    
print(f'Total entries in CSV: {csv_count}')
print(f'Difference: {total - csv_count}')
