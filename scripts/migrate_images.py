import os
import json
import re
import shutil
from pathlib import Path

# Configuration
DATA_FILE = "assets/js/data.js"
PERFUMES_DIR = "assets/img/perfumes"

def migrate_images():
    print("Starting image migration...")

    # 1. Read data.js
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract the array content using regex
    # Look for the content inside [ ... ] after 'var catalogData ='
    match = re.search(r'var\s+catalogData\s*=\s*(\[.*\]);', content, re.DOTALL)
    if not match:
        print("Error: Could not find catalogData array in data.js")
        return

    array_str = match.group(1)

    # Since it's a JS array with unquoted keys, we'll convert it to a JSON-like format
    # This is a risky part; we'll use a safer approach:
    # We will iterate through the objects using regex and update them individually.

    # Pattern to find each perfume object { house: "...", name: "...", image: "..." }
    perfume_pattern = re.compile(r'\{\s*house:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*image:\s*"([^"]+)"\s*\}')

    # We'll use a substitution function to update paths and move files
    def update_perfume(m):
        house = m.group(1)
        name = m.group(2)
        old_path = m.group(3)

        # Only process if it's an image in the perfumes root
        if not old_path or "assets/img/perfumes/" not in old_path:
            return m.group(0)

        # Check if it's already in a subfolder
        # Relative to assets/img/perfumes/, if there is a '/' after the root, it's already in a folder
        path_parts = old_path.split('assets/img/perfumes/')
        if len(path_parts) > 1 and '/' in path_parts[1]:
            return m.group(0)

        filename = os.path.basename(old_path)
        source_file = os.path.join(os.getcwd(), old_path)

        # Define house folder
        # We'll use the house name directly but ensure it's a valid folder name
        house_folder = house.replace('/', '_').replace('\\', '_')
        dest_dir = os.path.join(os.getcwd(), PERFUMES_DIR, house_folder)
        dest_file = os.path.join(dest_dir, filename)

        try:
            if os.path.exists(source_file):
                os.makedirs(dest_dir, exist_ok=True)
                shutil.move(source_file, dest_file)

                new_path = f"assets/img/perfumes/{house_folder}/{filename}"
                print(f"Moved: {filename} -> {house_folder}/")

                # Return the updated object string
                return f'{{ house: "{house}", name: "{name}", image: "{new_path}" }}'
            else:
                print(f"Warning: File not found {source_file}, skipping move.")
                return m.group(0)
        except Exception as e:
            print(f"Error moving {filename}: {e}")
            return m.group(0)

    # Perform the update on the array string
    new_array_str = perfume_pattern.sub(update_perfume, array_str)

    # Reconstruct the final file content
    # We replace only the array part to keep the variable declaration intact
    new_content = content.replace(array_str, new_array_str)

    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print("\nMigration complete. Data.js updated.")

if __name__ == "__main__":
    migrate_images()
