import re
import sys

with open('frontend/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'<script>(.*?)</script>', content, re.DOTALL | re.IGNORECASE)
if not match:
    print("No script tag found")
    sys.exit(1)

script_content = match.group(1)
try:
    compile(script_content, '<string>', 'exec')
    print("Syntax check (Python-style): OK (Note: This only checks basic structure, not JS specifics like backticks correctly)")
except SyntaxError as e:
    print(f"Potential Syntax Error: {e}")

# Save to temp file for node check
with open('temp_script.js', 'w', encoding='utf-8') as f:
    f.write(script_content)

print("Script extracted to temp_script.js. Use node --check temp_script.js")
