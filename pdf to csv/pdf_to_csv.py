import pdfplumber
import csv
import os
import sys
from pathlib import Path


def translate_headers(headers):
    """
    Translate Turkish headers to English.
    
    Args:
        headers (list): List of header strings
    
    Returns:
        list: Translated headers
    """
    translation_map = {
        'İL': 'Province',
        'SAĞLIK TESİSİ ADI': 'Health Facility Name',
        'SAĞLIK TESİSİ TÜRÜ': 'Health Facility Type',
        'ADRES': 'Address',
        'TELEFON': 'Phone',
        'SIRA\nNO': 'No',
        'SIRA NO': 'No'
    }
    
    return [translation_map.get((header or '').strip(), (header or '').strip()) for header in headers]


def is_header_row(row):
    """Check if a row contains the expected headers."""
    if not row:
        return False
    row_text = ' '.join([str(cell) for cell in row if cell])
    return 'İL' in row_text and 'SAĞLIK TESİSİ' in row_text


def extract_tables_from_pdf(pdf_path, output_csv_path=None):
    """
    Extract tables from a PDF file and convert to CSV with English headers.
    
    Args:
        pdf_path (str): Path to the input PDF file
        output_csv_path (str, optional): Path to the output CSV file. 
                                         If not provided, uses the same name as PDF with .csv extension
    
    Returns:
        str: Path to the created CSV file
    """
    # Validate input file
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")
    
    # Generate output path if not provided
    if output_csv_path is None:
        base_name = os.path.splitext(pdf_path)[0]
        output_csv_path = f"{base_name}.csv"
    
    all_data_rows = []
    headers_found = False
    english_headers = []
    
    # Open the PDF
    with pdfplumber.open(pdf_path) as pdf:
        print(f"Processing {len(pdf.pages)} page(s)...")
        
        # Extract tables from each page
        for page_num, page in enumerate(pdf.pages, start=1):
            print(f"Extracting tables from page {page_num}...")
            tables = page.extract_tables()
            
            if tables:
                for table_num, table in enumerate(tables, start=1):
                    if not table:
                        continue
                    
                    print(f"  Processing table {table_num} with {len(table)} rows")
                    
                    # Process each row in the table
                    for row_idx, row in enumerate(table):
                        # Look for the header row
                        if not headers_found and is_header_row(row):
                            print(f"  Found header row at index {row_idx}: {row}")
                            english_headers = translate_headers(row)
                            headers_found = True
                        # Skip title rows and header rows
                        elif headers_found and not is_header_row(row):
                            # Skip rows that are all None or empty
                            if row and any(cell for cell in row):
                                cleaned_row = [cell if cell is not None else '' for cell in row]
                                all_data_rows.append(cleaned_row)
            else:
                print(f"  No tables found on page {page_num}")
    
    if not headers_found:
        print("Warning: No tables found in the PDF!")
        return None
    
    # Write to CSV
    with open(output_csv_path, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        # Write English headers
        writer.writerow(english_headers)
        # Write data rows
        writer.writerows(all_data_rows)
    
    print(f"\nSuccessfully created CSV file: {output_csv_path}")
    print(f"Headers: {english_headers}")
    print(f"Total data rows written: {len(all_data_rows)}")
    
    return output_csv_path


def process_folder():
    """Process all PDF files from input folder and save to output folder."""
    # Get script directory
    script_dir = Path(__file__).parent
    input_dir = script_dir / "input"
    output_dir = script_dir / "output"
    
    # Create folders if they don't exist
    input_dir.mkdir(exist_ok=True)
    output_dir.mkdir(exist_ok=True)
    
    # Find all PDF files in input folder
    pdf_files = list(input_dir.glob("*.pdf"))
    
    if not pdf_files:
        print(f"No PDF files found in: {input_dir}")
        print(f"\nPlease place your PDF files in the 'input' folder and run again.")
        return
    
    print(f"Found {len(pdf_files)} PDF file(s) to process\n")
    print("=" * 70)
    
    success_count = 0
    failed_files = []
    
    for pdf_file in pdf_files:
        print(f"\n📄 Processing: {pdf_file.name}")
        print("-" * 70)
        
        # Generate output CSV path
        output_csv = output_dir / f"{pdf_file.stem}.csv"
        
        try:
            result = extract_tables_from_pdf(str(pdf_file), str(output_csv))
            if result:
                success_count += 1
                print(f"✓ Successfully converted to: {output_csv.name}")
        except Exception as e:
            failed_files.append((pdf_file.name, str(e)))
            print(f"✗ Error processing {pdf_file.name}: {e}")
    
    # Summary
    print("\n" + "=" * 70)
    print(f"\n📊 SUMMARY:")
    print(f"   Total files processed: {len(pdf_files)}")
    print(f"   Successful: {success_count}")
    print(f"   Failed: {len(failed_files)}")
    
    if failed_files:
        print(f"\n❌ Failed files:")
        for filename, error in failed_files:
            print(f"   - {filename}: {error}")
    
    if success_count > 0:
        print(f"\n✓ CSV files saved to: {output_dir}")


def main():
    """Main function to run the converter from command line."""
    # If no arguments, process input folder
    if len(sys.argv) < 2:
        process_folder()
    else:
        # Original single file mode
        pdf_path = sys.argv[1]
        output_csv_path = sys.argv[2] if len(sys.argv) > 2 else None
        
        try:
            result = extract_tables_from_pdf(pdf_path, output_csv_path)
            if result:
                print("\n✓ Conversion completed successfully!")
        except Exception as e:
            print(f"\n✗ Error: {e}")
            print(f"\n✗ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
