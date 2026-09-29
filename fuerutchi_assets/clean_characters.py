import os, json, base64
from PIL import Image

output_dir = '/Users/takehirokubokawa/Library/CloudStorage/GoogleDrive-kubokawa@kawase2018.org/マイドライブ/Antigravity/Antigravity_Artifacts/bio_summer_apps/fuerutchi_assets/characters'

def remove_small_components(img_path):
    img = Image.open(img_path).convert('RGBA')
    w, h = img.size
    pix = img.load()
    
    # Find all connected components of non-transparent pixels
    visited = [[False]*h for _ in range(w)]
    components = []
    
    for x in range(w):
        for y in range(h):
            if pix[x, y][3] > 10 and not visited[x][y]:
                # BFS
                comp = []
                queue = [(x, y)]
                visited[x][y] = True
                while queue:
                    cx, cy = queue.pop(0)
                    comp.append((cx, cy))
                    for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < w and 0 <= ny < h and not visited[nx][ny]:
                            if pix[nx, ny][3] > 10:
                                visited[nx][ny] = True
                                queue.append((nx, ny))
                components.append(comp)
                
    if not components:
        return
        
    # Sort components by size descending
    components.sort(key=len, reverse=True)
    main_comp_size = len(components[0])
    
    # Clear any component that is smaller than 5% of main component
    for comp in components[1:]:
        if len(comp) < main_comp_size * 0.08:
            for cx, cy in comp:
                pix[cx, cy] = (0, 0, 0, 0)
                
    # Re-crop to bbox and center
    bbox = img.getbbox()
    if bbox:
        crop = img.crop(bbox)
        mw = max(crop.size)
        pad = int(mw * 0.08)
        sq = Image.new('RGBA', (mw + pad * 2, mw + pad * 2), (0, 0, 0, 0))
        sq.paste(crop, (pad + (mw - crop.width)//2, pad + (mw - crop.height)//2))
        res = sq.resize((180, 180), Image.Resampling.LANCZOS)
        res.save(img_path, 'PNG')

# Process all 20 images
chars = ['kubokawatch', 'midoctchi', 'usatchi', 'pochitchi', 'gurucchi']
exprs = ['normal', 'happy', 'sad', 'angry']

character_data = {}

for char_id in chars:
    character_data[char_id] = {}
    for expr in exprs:
        p = os.path.join(output_dir, f'{char_id}_{expr}.png')
        remove_small_components(p)
        with open(p, 'rb') as f:
            b64 = base64.b64encode(f.read()).decode('utf-8')
        character_data[char_id][expr] = f'data:image/png;base64,{b64}'
        print(f'Cleaned {char_id}_{expr}.png')

json_path = os.path.join(output_dir, 'all_characters_expressions.json')
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(character_data, f, ensure_ascii=False)

print('Cleaned and saved JSON successfully!')
