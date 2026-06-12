import re

def check_html_nesting(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Strip comments
    content = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)
    
    # Find all tags
    # Matches <div ...> or </div> or other tags we care about. Let's trace divs first since they are the most common cause of layout issues.
    tag_regex = re.compile(r'<(/?)(div|section|main|header|footer|nav|ul|li|h1|h2|h3|h4|h5|h6|p|span|a|button)(?:\s+[^>]*)?>', re.IGNORECASE)
    
    stack = []
    errors = []
    
    # Line positions
    lines = content.split('\n')
    line_starts = []
    current_pos = 0
    for line in lines:
        line_starts.append(current_pos)
        current_pos += len(line) + 1 # +1 for newline
        
    def get_line_num(char_idx):
        for idx, start in enumerate(line_starts):
            if char_idx < start:
                return idx
        return len(lines)

    for match in tag_regex.finditer(content):
        is_closing = bool(match.group(1))
        tag_name = match.group(2).lower()
        start_pos = match.start()
        line_num = get_line_num(start_pos)
        
        # Skip self-closing tags if match is a start tag but ends with /> (though regex is simple, let's check the tag string)
        tag_str = match.group(0)
        if not is_closing and tag_str.endswith('/>'):
            continue
            
        if not is_closing:
            stack.append((tag_name, line_num, tag_str))
        else:
            if not stack:
                errors.append(f"Unexpected closing tag </{tag_name}> on line {line_num}")
            else:
                open_name, open_line, open_str = stack.pop()
                if open_name != tag_name:
                    errors.append(f"Mismatched tags: opened <{open_name}> on line {open_line} but closed </{tag_name}> on line {line_num}")
                    # Put the open one back or try to synchronize? Let's just report and keep going
                    # For a simple stack, we can just push it back or push the mismatch
                    
    while stack:
        open_name, open_line, open_str = stack.pop()
        errors.append(f"Unclosed tag <{open_name}> opened on line {open_line}: {open_str}")
        
    return errors

errors = check_html_nesting('index.html')
for err in errors[:50]:
    print(err)
