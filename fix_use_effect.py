import re
import glob

files = glob.glob('buildboard-frontend/src/**/*.jsx', recursive=True)

for file in files:
    with open(file, 'r') as f:
        content = f.read()

    # match useEffect block
    # useEffect(() => { ... }, [...])
    pattern = r'(?:^|\n)([ \t]*useEffect\(\(\) => \{[^{}]*?\}\, \[.*?\]\)\n)'
    
    matches = list(re.finditer(pattern, content, re.DOTALL))
    if not matches:
        continue
        
    for match in matches:
        use_effect_block = match.group(1)
        # find what it calls
        call_match = re.search(r'([a-zA-Z0-9_]+)\(\)', use_effect_block)
        if not call_match:
            continue
            
        func_name = call_match.group(1)
        
        # Check if func is declared AFTER this useEffect
        func_decl = r'const ' + func_name + r' = async \(\) => \{'
        decl_match = re.search(func_decl, content)
        if decl_match and decl_match.start() > match.start():
            print(f"Fixing {func_name} in {file}")
            
            # We need to remove useEffect from its current position
            content = content.replace(use_effect_block, '\n')
            
            # Find the end of the func declaration
            # This is tricky because of nested braces.
            # Let's just find the next line that starts with `  }` or `  const ` or `  if ` or `  return `
            # A better way is to insert the useEffect right before `  if (loading)` or `  return `
            
            insert_pos = content.find('  if (loading)')
            if insert_pos == -1:
                insert_pos = content.find('  return (')
                
            if insert_pos != -1:
                content = content[:insert_pos] + use_effect_block + '\n' + content[insert_pos:]
            
    with open(file, 'w') as f:
        f.write(content)

