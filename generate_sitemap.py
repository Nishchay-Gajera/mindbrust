import os
from datetime import datetime

def generate_sitemap(start_path, output_file, base_url):
    """
    Generates a sitemap.xml file by scanning for HTML files in a given directory.

    Args:
        start_path (str): The starting directory to scan for HTML files.
        output_file (str): The path to the output sitemap.xml file.
        base_url (str): The base URL of the website.
    """
    urls = []
    # Ignore specific directories and files
    exclude_dirs = {'components'} # Add any directory names you want to exclude
    exclude_files = set() # Add any file names you want to exclude

    for root, dirs, files in os.walk(start_path, topdown=True):
        # Exclude specified directories
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for file in files:
            if file.endswith(".html") and file not in exclude_files:
                # Construct the full path and URL
                full_path = os.path.join(root, file)
                # Create a URL relative to the start path
                relative_path = os.path.relpath(full_path, start_path)
                # Ensure forward slashes for the URL
                url = f"{base_url}/{relative_path.replace(os.sep, '/')}"
                
                # Get the last modification time
                last_mod_timestamp = os.path.getmtime(full_path)
                last_mod_date = datetime.fromtimestamp(last_mod_timestamp).strftime('%Y-%m-%d')

                urls.append({
                    "loc": url,
                    "lastmod": last_mod_date
                })

    # Generate the XML content
    xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for url_info in urls:
        xml_content += '  <url>\n'
        xml_content += f'    <loc>{url_info["loc"]}</loc>\n'
        xml_content += f'    <lastmod>{url_info["lastmod"]}</lastmod>\n'
        # You can customize these values
        xml_content += '    <changefreq>Daily</changefreq>\n'
        xml_content += '    <priority>0.9</priority>\n'
        xml_content += '  </url>\n'
    xml_content += '</urlset>'

    # Write the sitemap to the output file
    with open(output_file, 'w') as f:
        f.write(xml_content)

    print(f"Sitemap successfully generated at: {output_file}")

if __name__ == "__main__":
    # --- Configuration ---
    # The directory where your HTML files are located.
    # '.' means the current directory where the script is run.
    project_directory = '.' 
    # The name of the output sitemap file.
    sitemap_file = 'sitemap.xml'
    # The base URL of your website.
    website_url = 'https://www.mindbrust.com'

    generate_sitemap(project_directory, sitemap_file, website_url)  