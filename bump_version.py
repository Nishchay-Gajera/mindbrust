def bump_version():
    """
    Increments the version number in version.txt (e.g., 1.0.0 -> 1.0.1).
    """
    try:
        with open('version.txt', 'r') as f:
            version_str = f.read().strip()
        
        parts = list(map(int, version_str.split('.')))
        
        # Increment the last part (patch version)
        parts[-1] += 1
        
        new_version = '.'.join(map(str, parts))
        
        with open('version.txt', 'w') as f:
            f.write(new_version)
            
        print(f"Version bumped from {version_str} to {new_version}")
        return new_version

    except FileNotFoundError:
        print("Error: 'version.txt' not found. Creating it with version 1.0.0.")
        with open('version.txt', 'w') as f:
            f.write('1.0.0')
        return '1.0.0'
    except Exception as e:
        print(f"An error occurred: {e}")
        return None

if __name__ == "__main__":
    bump_version()