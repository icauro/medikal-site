import csv
import os
from collections import Counter

# Change to output directory
os.chdir('output')

for file in os.listdir('.'):
    if file.endswith('.csv'):
        print(f'=== {file} ===')
        with open(file, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            headers = next(reader)  # Skip header
            facility_types = []
            for row in reader:
                if len(row) >= 4:
                    facility_types.append(row[3])
            counts = Counter(facility_types)
            for typ, count in sorted(counts.items())[:10]:  # Show top 10
                print(f'{typ}: {count}')
        print()