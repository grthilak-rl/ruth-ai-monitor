"""
Notebook Conversion Script
Converts Jupyter notebooks to production Python code
"""

import os
import json
import nbformat
from nbconvert import PythonExporter
import argparse
from pathlib import Path

def clean_python_code(code: str) -> str:
    """Clean up converted Python code"""
    lines = code.split('\n')
    cleaned_lines = []
    
    for line in lines:
        # Skip notebook-specific commands
        if line.strip().startswith(('get_ipython()', '%', '!', 'plt.show()')):
            continue
        # Skip empty cells markers
        if '# In[' in line and ']:' in line:
            continue
        cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines)

def convert_notebook_to_python(notebook_path: str, output_path: str = None):
    """Convert a notebook to Python script"""
    notebook_path = Path(notebook_path)
    
    if output_path is None:
        output_path = f"../src/models/{notebook_path.stem}.py"
    
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Read the notebook
    with open(notebook_path, 'r', encoding='utf-8') as f:
        notebook = nbformat.read(f, as_version=4)
    
    # Filter cells (remove markdown and visualization cells)
    code_cells = []
    for cell in notebook.cells:
        if cell.cell_type == 'code':
            # Skip cells with visualization or debugging code
            source = cell.source.lower()
            if not any(skip_word in source for skip_word in [
                'plt.', 'sns.', 'display(', 'print(', '%matplotlib', 
                'fig,', 'ax =', '.plot(', '.show()', 'wandb.', 'mlflow.'
            ]):
                code_cells.append(cell)
    
    # Create new notebook with filtered cells
    filtered_notebook = nbformat.v4.new_notebook(cells=code_cells)
    
    # Convert to Python
    exporter = PythonExporter()
    python_code, _ = exporter.from_notebook_node(filtered_notebook)
    
    # Clean up the code
    cleaned_code = clean_python_code(python_code)
    
    # Add header
    header = f'''"""
{notebook_path.stem} - Converted from Jupyter Notebook
Auto-generated from: {notebook_path.name}
"""

'''
    
    final_code = header + cleaned_code
    
    # Write to file
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(final_code)
    
    print(f"Converted {notebook_path} -> {output_path}")

def convert_all_notebooks(notebooks_dir: str = "notebooks", output_dir: str = "src/models"):
    """Convert all notebooks in a directory"""
    notebooks_dir = Path(notebooks_dir)
    
    if not notebooks_dir.exists():
        print(f"Notebooks directory {notebooks_dir} does not exist")
        return
    
    # Find all .ipynb files
    notebook_files = list(notebooks_dir.rglob("*.ipynb"))
    
    if not notebook_files:
        print("No notebook files found")
        return
    
    print(f"Found {len(notebook_files)} notebook files")
    
    for notebook_file in notebook_files:
        try:
            # Skip checkpoint files
            if '.ipynb_checkpoints' in str(notebook_file):
                continue
                
            output_file = Path(output_dir) / f"{notebook_file.stem}.py"
            convert_notebook_to_python(notebook_file, output_file)
        except Exception as e:
            print(f"Error converting {notebook_file}: {e}")

def main():
    parser = argparse.ArgumentParser(description='Convert Jupyter notebooks to Python scripts')
    parser.add_argument('--notebook', '-n', help='Single notebook file to convert')
    parser.add_argument('--output', '-o', help='Output Python file path')
    parser.add_argument('--notebooks-dir', '-d', default='notebooks', help='Directory containing notebooks')
    parser.add_argument('--output-dir', default='src/models', help='Output directory for Python files')
    
    args = parser.parse_args()
    
    if args.notebook:
        convert_notebook_to_python(args.notebook, args.output)
    else:
        convert_all_notebooks(args.notebooks_dir, args.output_dir)

if __name__ == "__main__":
    main()
