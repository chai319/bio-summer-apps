#!/usr/bin/env python3
"""
Generate high-resolution (300 DPI) graph grid image for Fuerutchi experiment
X-axis: 1 to 30 days
Y-axis: 0 to 150 (tick marks at 0, 50, 100, 150; minor grid every 10)
"""

import os
from PIL import Image, ImageDraw, ImageFont

def create_graph_image(output_path, title="成長曲線グラフ（日ごとの個体数をプロットしよう）"):
    # Image dimensions (tight bounding box to prevent Word clipping)
    # Width: 1180px, Height: 750px
    width = 1180
    height = 750
    img = Image.new("RGB", (width, height), color="#ffffff")
    draw = ImageDraw.Draw(img)

    # Fonts
    font_path_bold = "/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc"
    font_path_reg = "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc"
    
    font_title = ImageFont.truetype(font_path_bold, 20)
    font_sub = ImageFont.truetype(font_path_reg, 15)
    font_axis = ImageFont.truetype(font_path_bold, 18)
    font_tick = ImageFont.truetype(font_path_bold, 16)
    font_tick_small = ImageFont.truetype(font_path_reg, 14)

    # Graph plotting area coordinates
    left = 80
    right = 1080
    top = 65
    bottom = 665

    plot_width = right - left    # 1000px
    plot_height = bottom - top   # 600px

    # Title & Header
    draw.text((left, 15), f"■ {title}", fill="#1a202c", font=font_title)
    draw.text((right, 18), "※変曲点や頭打ちに印をつけよう", fill="#718096", font=font_sub, anchor="ra")

    # Grid settings
    # X: 30 days -> step = 1000 / 30 = 33.3333 px per day
    x_step = plot_width / 30.0

    # Y: 0 to 150 -> 15 divisions of 10 -> step = 600 / 15 = 40.0 px per 10 units
    y_step_10 = plot_height / 15.0

    # Draw minor grid lines (vertical: every 1 day)
    for d in range(1, 31):
        x = left + d * x_step
        color = "#edf2f7" if d not in [5, 10, 15, 20, 25, 30] else "#cbd5e0"
        width_line = 1 if d not in [5, 10, 15, 20, 25, 30] else 2
        draw.line([(x, top), (x, bottom)], fill=color, width=width_line)

    # Draw minor grid lines (horizontal: every 10 units)
    for i in range(1, 15):
        y = bottom - i * y_step_10
        # 50, 100 are major
        if i in [5, 10]:
            draw.line([(left, y), (right, y)], fill="#a0aec0", width=2)
        else:
            draw.line([(left, y), (right, y)], fill="#edf2f7", width=1)

    # Draw Major Axes (left and bottom)
    draw.line([(left, top), (left, bottom)], fill="#2d3748", width=3)
    draw.line([(left, bottom), (right, bottom)], fill="#2d3748", width=3)
    # Right and Top border (enclosed box)
    draw.line([(right, top), (right, bottom)], fill="#718096", width=2)
    draw.line([(left, top), (right, top)], fill="#718096", width=2)

    # Y-axis ticks and labels (0, 50, 100, 150)
    y_ticks = [
        (0, bottom),
        (50, bottom - 5 * y_step_10),
        (100, bottom - 10 * y_step_10),
        (150, bottom - 15 * y_step_10),
    ]
    for val, y in y_ticks:
        draw.line([(left - 10, y), (left, y)], fill="#2d3748", width=3)
        draw.line([(right, y), (right + 6, y)], fill="#718096", width=2)
        draw.text((left - 14, y), str(val), fill="#2d3748", font=font_tick, anchor="rm")

    # Minor Y ticks (every 10 units)
    for i in range(1, 15):
        if i not in [5, 10]:
            y = bottom - i * y_step_10
            draw.line([(left - 5, y), (left, y)], fill="#718096", width=2)

    # Y-axis Title (placed safely above Y axis)
    draw.text((left - 14, top - 26), "個体数 (匹)", fill="#2d3748", font=font_axis, anchor="la")

    # X-axis ticks and labels (1 to 30)
    for d in range(1, 31):
        x = left + d * x_step
        if d in [1, 5, 10, 15, 20, 25, 30]:
            draw.line([(x, bottom), (x, bottom + 10)], fill="#2d3748", width=3)
            draw.text((x, bottom + 14), str(d), fill="#2d3748", font=font_tick, anchor="mt")
        else:
            draw.line([(x, bottom), (x, bottom + 5)], fill="#718096", width=1)

    # X-axis Title (placed below X axis near 30)
    draw.text((right, bottom + 42), "日数 (Day)", fill="#2d3748", font=font_axis, anchor="ra")

    # Save
    img.save(output_path, dpi=(300, 300))
    print(f"Graph image saved to {output_path}")

if __name__ == "__main__":
    out_dir = "/Users/takehirokubokawa/Library/CloudStorage/GoogleDrive-kubokawa@kawase2018.org/マイドライブ/Antigravity/Antigravity_Artifacts/bio_summer_apps"
    create_graph_image(f"{out_dir}/graph_grid_150.png")
