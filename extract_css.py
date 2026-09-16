import re

with open('/Users/chaitanya/Downloads/Trane_Intelligence_Platform_20.html', 'r') as f:
    content = f.read()

start_marker = '/*=== MONITORING SCREEN ===*/'
end_marker = '/* === INSIGHT MODAL === */'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx != -1 and end_idx != -1:
    css_block = content[start_idx:end_idx].strip()
    with open('/Users/chaitanya/ai-frontend/src/monitor.css', 'w') as f:
        f.write(css_block)
    print("Successfully extracted CSS")
else:
    print("Could not find markers")
