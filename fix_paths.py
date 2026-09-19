import os
import re

frontend_dir = r'C:\Users\hp\Downloads\files (2)\frontend'

def process_file(filepath, sub_dir):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Fix CSS links
    # Was: assets/css/style.css -> Now: ../css/style.css (for website, admin, trainee, trainer)
    # Also handle ../assets/css/style.css -> ../css/style.css
    content = re.sub(r'assets/css/([^"''\s>]+)', r'../css/\1', content)
    content = re.sub(r'\.\./assets/css/([^"''\s>]+)', r'../css/\1', content)

    # Fix JS links
    content = re.sub(r'assets/js/([^"''\s>]+)', r'../js/\1', content)
    content = re.sub(r'\.\./assets/js/([^"''\s>]+)', r'../js/\1', content)

    # Fix dataset links
    content = re.sub(r'dataset/([^"''\s>]+)', r'../dataset/\1', content)
    content = re.sub(r'\.\./dataset/([^"''\s>]+)', r'../dataset/\1', content)

    # Fix internal page links
    # The sub_dirs are: website, admin, trainee, trainer
    
    def replacer(match):
        href = match.group(1)
        # ignore absolute URLs
        if href.startswith('http') or href.startswith('#') or href.startswith('javascript:'):
            return match.group(0)

        # Map common files to their new locations
        # if href is just "login.html" in website, it's correct. 
        # if it's "login.html" in trainee, it should be "../website/login.html"
        
        # normalize first to resolve ../
        parts = href.split('/')
        if sub_dir == 'website':
            # links like trainee/dashboard.html -> ../trainee/dashboard.html
            if len(parts) > 1 and parts[0] in ['trainee', 'trainer', 'admin']:
                return match.group(0).replace(href, f'../{href}')
            if href in ['index.html', 'login.html', 'signup.html', 'courses.html', 'support.html']:
                return match.group(0) # same folder
            if href == '../index.html': return match.group(0).replace(href, 'index.html')
            if href == '../login.html': return match.group(0).replace(href, 'login.html')
            
        else: # admin, trainee, trainer
            # links like ../login.html -> ../website/login.html
            if href == '../login.html': return match.group(0).replace(href, '../website/login.html')
            if href == '../signup.html': return match.group(0).replace(href, '../website/signup.html')
            if href == '../index.html': return match.group(0).replace(href, '../website/index.html')
            if href == '../courses.html': return match.group(0).replace(href, '../website/courses.html')
            if href == '../support.html': return match.group(0).replace(href, '../website/support.html')
            
            # links to other roles: ../trainer/dashboard.html (already correct)
            # links to same role: dashboard.html (already correct)

        return match.group(0)
    
    # replace href="..." and signUpUrl: "..." etc in JS scripts inside HTML
    content = re.sub(r'href="([^"]+)"', replacer, content)
    content = re.sub(r'signUpUrl:\s*"([^"]+)"', replacer, content)
    content = re.sub(r'signInUrl:\s*"([^"]+)"', replacer, content)
    content = re.sub(r'window\.location\.href\s*=\s*(["''].*?["''])', 
                    lambda m: m.group(0).replace('../login.html', '../website/login.html').replace('../index.html', '../website/index.html'), 
                    content)

    if original != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk(frontend_dir):
    for file in files:
        if file.endswith('.html'):
            sub_dir = os.path.basename(root)
            process_file(os.path.join(root, file), sub_dir)

