#!/usr/bin/env python3
"""
Build script to compile the React frontend for production deployment.
This script will:
1. Install frontend dependencies
2. Build the React app
3. Copy built files to Flask static directory
"""

import os
import subprocess
import shutil
import sys
from pathlib import Path

def run_command(command, cwd=None, shell=True):
    """Run a command and return success status"""
    try:
        print(f"Running: {command}")
        result = subprocess.run(command, cwd=cwd, shell=shell, check=True, capture_output=True, text=True)
        print(f"SUCCESS: {command}")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"FAILED: {command}")
        print(f"Error: {e.stderr}")
        return False

def main():
    print("Building frontend for production deployment...")
    
    # Get the project root directory
    project_root = Path(__file__).parent
    frontend_dir = project_root / "frontend" / "project"
    
    # Check if frontend directory exists
    if not frontend_dir.exists():
        print(f"ERROR: Frontend directory not found: {frontend_dir}")
        sys.exit(1)
    
    print(f"Frontend directory: {frontend_dir}")
    
    # Step 1: Install frontend dependencies
    print("\nInstalling frontend dependencies...")
    if not run_command("npm install", cwd=frontend_dir):
        print("ERROR: Failed to install frontend dependencies")
        sys.exit(1)
    
    # Step 2: Build the React app
    print("\nBuilding React application...")
    if not run_command("npm run build", cwd=frontend_dir):
        print("ERROR: Failed to build React application")
        sys.exit(1)
    
    # Step 3: Create Flask static directories
    print("\nCreating Flask static directories...")
    static_dir = project_root / "static"
    templates_dir = project_root / "templates"
    
    # Create directories if they don't exist
    static_dir.mkdir(exist_ok=True)
    templates_dir.mkdir(exist_ok=True)
    
    # Step 4: Copy built files to Flask static directory
    print("\nCopying built files to Flask static directory...")
    dist_dir = frontend_dir / "dist"
    
    if not dist_dir.exists():
        print("ERROR: Build directory not found. Build may have failed.")
        sys.exit(1)
    
    # Copy all files from dist to static
    if static_dir.exists():
        shutil.rmtree(static_dir)
    shutil.copytree(dist_dir, static_dir)
    
    # Step 5: Create index.html template
    print("\nCreating Flask template...")
    index_html = static_dir / "index.html"
    if index_html.exists():
        # Read the built index.html
        with open(index_html, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace asset paths to use /static/ prefix for Flask
        template_content = content.replace('/assets/', '/static/assets/')
        
        # Write template
        template_file = templates_dir / "index.html"
        with open(template_file, 'w', encoding='utf-8') as f:
            f.write(template_content)
        
        print(f"SUCCESS: Created Flask template: {template_file}")
    
    print("\nSUCCESS: Frontend build completed successfully!")
    print("Static files copied to: ./static/")
    print("Template created at: ./templates/index.html")
    print("\nReady for deployment!")

if __name__ == "__main__":
    main()
