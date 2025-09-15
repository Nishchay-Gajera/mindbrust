import os
import re

def apply_cache_busting(start_path, version):
    """
    Applies cache-busting versioning to CSS and JS links in HTML files.

    Args:
        start_path (str): The directory to scan for HTML files.
        version (str): The version string to append.
    """
    print(f"Applying version: {version}")
    # Regex to find local CSS and JS files, excluding external links
    # It will match href="path/to/style.css" or src="path/to/script.js"
    pattern = re.compile(r'(<link[^>]+href="|<script[^>]+src=")(?!https?:\/\/)([^"]+\.(?:css|js))"')

    for root, dirs, files in os.walk(start_path):
        # Exclude component files from being modified
        if 'components' in dirs:
            dirs.remove('components')
            
        for file in files:
            if file.endswith(".html"):
                full_path = os.path.join(root, file)
                
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Replace links with versioned links
                # The lambda function reassembles the tag with the version string
                new_content = pattern.sub(
                    lambda m: f'{m.group(1)}{m.group(2)}?v={version}"',
                    content
                )

                # Write the updated content back to the file
                if content != new_content:
                    with open(full_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated cache-busting links in: {full_path}")

if __name__ == "__main__":
    try:
        # --- Read the version from version.txt ---
        with open('version.txt', 'r') as f:
            current_version = f.read().strip()
        
        if not current_version:
            raise ValueError("version.txt is empty.")

        # The directory where your HTML files are located
        project_directory = '.'
        apply_cache_busting(project_directory, current_version)
        print("\nCache-busting applied successfully!")

    except FileNotFoundError:
        print("Error: 'version.txt' not found. Please create it with a version number (e.g., 1.0.0).")
    except Exception as e:
        print(f"An error occurred: {e}")