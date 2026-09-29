import os, json, base64
from PIL import Image

artifact_dir = '/Users/takehirokubokawa/.gemini/antigravity-ide/brain/8b26ff4a-547a-46c1-a648-23adf4a6618c'
output_dir = '/Users/takehirokubokawa/Library/CloudStorage/GoogleDrive-kubokawa@kawase2018.org/マイドライブ/Antigravity/Antigravity_Artifacts/bio_summer_apps/fuerutchi_assets/characters'
os.makedirs(output_dir, exist_ok=True)

sheets = {
    'kubokawatch': {
        'path': f'{artifact_dir}/kubokawatch_sheet_1790636012214.jpg',
        'boxes': {
            'normal': (0, 0, 512, 512),
            'happy': (512, 0, 1024, 512),
            'sad': (0, 512, 512, 1024),
            'angry': (512, 512, 1024, 1024),
        }
    },
    'midoctchi': {
        'path': f'{artifact_dir}/midoctchi_sheet_1790636026193.jpg',
        'boxes': {
            'normal': (0, 100, 512, 512),
            'happy': (512, 100, 1024, 512),
            'sad': (0, 590, 512, 1024),
            'angry': (512, 590, 1024, 1024),
        }
    },
    'usatchi': {
        'path': f'{artifact_dir}/usatchi_sheet_1790636045289.jpg',
        'boxes': {
            'normal': (0, 0, 512, 512),
            'happy': (512, 0, 1024, 512),
            'sad': (0, 512, 512, 1024),
            'angry': (512, 512, 1024, 1024),
        }
    },
    'pochitchi': {
        'path': f'{artifact_dir}/pochitchi_sheet_1790636060300.jpg',
        'boxes': {
            'normal': (50, 50, 480, 480),
            'happy': (540, 50, 970, 480),
            'sad': (50, 540, 480, 970),
            'angry': (540, 540, 970, 970),
        }
    },
    'gurucchi': {
        'path': f'{artifact_dir}/gurucchi_sheet_1790636079477.jpg',
        'boxes': {
            'normal': (10, 10, 505, 505),
            'happy': (518, 10, 1014, 505),
            'sad': (10, 518, 505, 1014),
            'angry': (518, 518, 1014, 1014),
        }
    }
}

def clean_and_transparent(crop):
    crop = crop.convert('RGBA')
    w, h = crop.size
    pix = crop.load()
    
    visited = set()
    queue = []
    
    # Check borders
    for x in range(w):
        for y in [0, h - 1]:
            r, g, b, a = pix[x, y]
            if r > 225 and g > 225 and b > 225:
                queue.append((x, y))
                visited.add((x, y))
    for y in range(h):
        for x in [0, w - 1]:
            if (x, y) not in visited:
                r, g, b, a = pix[x, y]
                if r > 225 and g > 225 and b > 225:
                    queue.append((x, y))
                    visited.add((x, y))
                    
    while queue:
        cx, cy = queue.pop(0)
        pix[cx, cy] = (0, 0, 0, 0)
        for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited:
                r, g, b, a = pix[nx, ny]
                if r > 225 and g > 225 and b > 225:
                    visited.add((nx, ny))
                    queue.append((nx, ny))
                    
    bbox = crop.getbbox()
    if bbox:
        crop = crop.crop(bbox)
        mw = max(crop.size)
        pad = int(mw * 0.08)
        sq = Image.new('RGBA', (mw + pad * 2, mw + pad * 2), (0, 0, 0, 0))
        sq.paste(crop, (pad + (mw - crop.width)//2, pad + (mw - crop.height)//2))
        crop = sq.resize((180, 180), Image.Resampling.LANCZOS)
    return crop

character_data = {}

for char_id, info in sheets.items():
    img = Image.open(info['path'])
    character_data[char_id] = {}
    for expr, box in info['boxes'].items():
        crop = img.crop(box)
        trans = clean_and_transparent(crop)
        save_path = os.path.join(output_dir, f'{char_id}_{expr}.png')
        trans.save(save_path, 'PNG')
        
        # Read back and convert to base64
        with open(save_path, 'rb') as f:
            b64 = base64.b64encode(f.read()).decode('utf-8')
        character_data[char_id][expr] = f'data:image/png;base64,{b64}'
        print(f'Saved {char_id}_{expr}.png')

# Save all base64 data to json
json_path = os.path.join(output_dir, 'all_characters_expressions.json')
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(character_data, f, ensure_ascii=False)

print('All 20 character expressions processed successfully!')
