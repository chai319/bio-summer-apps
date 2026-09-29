#!/usr/bin/env python3
"""
Generate A4 1-page printable Word (.docx) worksheet for Fuerutchi experiment
"""

import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor, Mm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_margins(cell, top=20, bottom=20, left=40, right=40):
    """Set cell margins in dxa (1 pt = 20 dxa)"""
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_shading(cell, color_hex):
    """Set cell background color"""
    shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading)

def set_cell_borders(cell, top=None, bottom=None, left=None, right=None):
    """Set individual cell borders"""
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    
    borders = {'top': top, 'bottom': bottom, 'left': left, 'right': right}
    for border_name, border_style in borders.items():
        if border_style:
            # border_style: (val, sz, space, color) e.g. ('single', '4', '0', 'A0AEC0')
            b_el = OxmlElement(f'w:{border_name}')
            b_el.set(qn('w:val'), border_style[0])
            b_el.set(qn('w:sz'), str(border_style[1]))
            b_el.set(qn('w:space'), '0')
            b_el.set(qn('w:color'), border_style[2])
            tcBorders.append(b_el)
        else:
            b_el = OxmlElement(f'w:{border_name}')
            b_el.set(qn('w:val'), 'none')
            tcBorders.append(b_el)
    tcPr.append(tcBorders)

def prevent_row_split(row):
    """Prevent row from splitting across pages"""
    trPr = row._tr.get_or_add_trPr()
    trPr.append(OxmlElement('w:cantSplit'))

def set_row_height(row, height_pt):
    """Set exact row height"""
    trPr = row._tr.get_or_add_trPr()
    trHeight = OxmlElement('w:trHeight')
    trHeight.set(qn('w:val'), str(int(height_pt * 20)))
    trHeight.set(qn('w:hRule'), 'exact')
    trPr.append(trHeight)

def build_docx(output_path, graph_img_path):
    doc = Document()
    
    # Page setup: A4 Portrait (210mm x 297mm)
    section = doc.sections[0]
    section.page_width = Mm(210)
    section.page_height = Mm(297)
    section.top_margin = Mm(8)
    section.bottom_margin = Mm(8)
    section.left_margin = Mm(9)
    section.right_margin = Mm(9)

    # Base font setting
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Hiragino Kaku Gothic ProN'
    font.size = Pt(8)
    font.color.rgb = RGBColor(0x1a, 0x20, 0x2c)
    
    # ----------------- 1. HEADER -----------------
    header_tbl = doc.add_table(rows=1, cols=2)
    header_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    header_tbl.autofit = False

    row = header_tbl.rows[0]
    prevent_row_split(row)
    c_left, c_right = row.cells[0], row.cells[1]
    c_left.width = Mm(145)
    c_right.width = Mm(47)

    # Left cell: Title & Subtitle
    p_title = c_left.paragraphs[0]
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(1)
    p_title.paragraph_format.line_spacing = 1.0
    r_title = p_title.add_run("高校生物 実習：個体群の成長と密度効果「ふえるっち」実験シート")
    r_title.font.size = Pt(8.5)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0x1a, 0x20, 0x2c)

    p_sub = c_left.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(2)
    p_sub.paragraph_format.line_spacing = 1.0
    r_sub = p_sub.add_run("【シミュレーター公開URL】 https://chai319.github.io/bio-summer-apps/fuerutchi_growth_sim.html")
    r_sub.font.size = Pt(6.5)
    r_sub.font.color.rgb = RGBColor(0x71, 0x80, 0x96)

    # Right cell: Student info
    p_info = c_right.paragraphs[0]
    p_info.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_info.paragraph_format.space_before = Pt(2)
    p_info.paragraph_format.space_after = Pt(2)
    p_info.paragraph_format.line_spacing = 1.0
    r_info = p_info.add_run("年　組　番　氏名：______________")
    r_info.font.size = Pt(7.5)
    r_info.font.bold = True

    set_cell_borders(c_left, bottom=('single', '12', '2D3748'))
    set_cell_borders(c_right, bottom=('single', '12', '2D3748'))
    set_cell_margins(c_left, top=0, bottom=25, left=0, right=5)
    set_cell_margins(c_right, top=0, bottom=25, left=5, right=0)

    # Space after header
    p_sep = doc.add_paragraph()
    p_sep.paragraph_format.space_before = Pt(0)
    p_sep.paragraph_format.space_after = Pt(2)
    p_sep.paragraph_format.line_spacing = 1.0

    # ----------------- HELPER FOR EXPERIMENT BLOCK -----------------
    def add_experiment_block(exp_num, exp_title, color_hex, cond_list):
        # Section Header Table (1 row, 2 cols)
        sec_tbl = doc.add_table(rows=1, cols=2)
        sec_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        sec_tbl.autofit = False
        r_sec = sec_tbl.rows[0]
        prevent_row_split(r_sec)
        c_title, c_cond = r_sec.cells[0], r_sec.cells[1]
        c_title.width = Mm(78)
        c_cond.width = Mm(114)

        set_cell_shading(c_title, "EDF2F7")
        set_cell_shading(c_cond, "EDF2F7")
        set_cell_borders(c_title, left=('single', '24', color_hex), top=('single', '4', 'CBD5E0'), bottom=('single', '4', 'CBD5E0'))
        set_cell_borders(c_cond, right=('single', '4', 'CBD5E0'), top=('single', '4', 'CBD5E0'), bottom=('single', '4', 'CBD5E0'))
        set_cell_margins(c_title, top=12, bottom=12, left=35, right=5)
        set_cell_margins(c_cond, top=12, bottom=12, left=5, right=25)

        # Title
        p_t = c_title.paragraphs[0]
        p_t.paragraph_format.space_before = Pt(0)
        p_t.paragraph_format.space_after = Pt(0)
        r_t = p_t.add_run(f"【実験 {exp_num}】 {exp_title}")
        r_t.font.size = Pt(7.5)
        r_t.font.bold = True
        rgb_color = RGBColor(0x2b, 0x6c, 0xb0) if color_hex == "3182CE" else RGBColor(0xc5, 0x30, 0x30)
        r_t.font.color.rgb = rgb_color

        # Conditions
        p_c = c_cond.paragraphs[0]
        p_c.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p_c.paragraph_format.space_before = Pt(0)
        p_c.paragraph_format.space_after = Pt(0)
        r_c = p_c.add_run("  ".join(cond_list))
        r_c.font.size = Pt(6.5)
        r_c.font.bold = True
        r_c.font.color.rgb = RGBColor(0x2d, 0x37, 0x48)

        # Content Table: Left = 30-Day Table, Right = Graph Image
        content_tbl = doc.add_table(rows=1, cols=2)
        content_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        content_tbl.autofit = False
        r_cont = content_tbl.rows[0]
        prevent_row_split(r_cont)
        c_data, c_graph = r_cont.cells[0], r_cont.cells[1]
        c_data.width = Mm(58)
        c_graph.width = Mm(134)
        set_cell_margins(c_data, top=10, bottom=5, left=0, right=10)
        set_cell_margins(c_graph, top=10, bottom=5, left=10, right=0)

        # Build 30-Day Table inside c_data (Total width = 56mm)
        data_tbl = c_data.add_table(rows=16, cols=4)
        data_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        data_tbl.autofit = False

        # Header Row
        r_hdr = data_tbl.rows[0]
        prevent_row_split(r_hdr)
        set_row_height(r_hdr, 11)
        headers = ["日数", "個体数", "日数", "個体数"]
        widths = [Mm(10), Mm(18), Mm(10), Mm(18)]
        for idx, (h, w) in enumerate(zip(headers, widths)):
            cell = r_hdr.cells[idx]
            cell.width = w
            set_cell_shading(cell, "E2E8F0")
            set_cell_borders(cell, top=('single', '6', '718096'), bottom=('single', '6', '718096'), left=('single', '6', '718096'), right=('single', '6', '718096'))
            set_cell_margins(cell, top=5, bottom=5, left=3, right=3)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(h)
            run.font.size = Pt(6.5)
            run.font.bold = True

        # Data Rows 1 to 15
        for i in range(1, 16):
            r = data_tbl.rows[i]
            prevent_row_split(r)
            set_row_height(r, 10.5)

            d1 = f"{i}日"
            d2 = f"{i+15}日"
            row_data = [(d1, True), ("", False), (d2, True), ("", False)]
            for idx, (val, is_day) in enumerate(row_data):
                cell = r.cells[idx]
                cell.width = widths[idx]
                shd = "F7FAFC" if is_day else "FFFFFF"
                set_cell_shading(cell, shd)
                set_cell_borders(cell, top=('single', '4', 'A0AEC0'), bottom=('single', '4', 'A0AEC0'), left=('single', '4', 'A0AEC0'), right=('single', '4', 'A0AEC0'))
                set_cell_margins(cell, top=3, bottom=3, left=3, right=3)
                cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
                p = cell.paragraphs[0]
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(0)
                run = p.add_run(val)
                run.font.size = Pt(6.5)
                if is_day:
                    run.font.bold = True

        # Graph Image inside c_graph
        p_graph = c_graph.paragraphs[0]
        p_graph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_graph.paragraph_format.space_before = Pt(0)
        p_graph.paragraph_format.space_after = Pt(0)
        # Add graph image: width 102mm
        p_graph.add_run().add_picture(graph_img_path, width=Mm(102))

        # Space between blocks
        p_spacer = doc.add_paragraph()
        p_spacer.paragraph_format.space_before = Pt(0)
        p_spacer.paragraph_format.space_after = Pt(1)
        p_spacer.paragraph_format.line_spacing = 1.0

    # ----------------- ADD EXPERIMENT 1 & 2 -----------------
    add_experiment_block(
        exp_num=1,
        exp_title="通常環境（環境抵抗あり・S字型成長曲線）",
        color_hex="3182CE",
        cond_list=["キャラ［　］", "①エサ［30/60/120］pt", "②広さ［30/60/120］匹", "③清掃［こまめ/サボり］"]
    )

    add_experiment_block(
        exp_num=2,
        exp_title="理想環境（環境抵抗ゼロ・J字型成長曲線）/ 条件変更",
        color_hex="E53E3E",
        cond_list=["キャラ［　］", "①エサ［無限/　］", "②広さ［無限/　］", "③清掃［うんち無/　］"]
    )

    # ----------------- 4. REFLECTION SECTION -----------------
    refl_tbl = doc.add_table(rows=1, cols=1)
    refl_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    refl_tbl.autofit = False
    row_refl = refl_tbl.rows[0]
    prevent_row_split(row_refl)
    c_refl = row_refl.cells[0]
    c_refl.width = Mm(192)

    set_cell_shading(c_refl, "FFFFFF")
    set_cell_borders(c_refl, top=('single', '10', '2D3748'), bottom=('single', '10', '2D3748'), left=('single', '10', '2D3748'), right=('single', '10', '2D3748'))
    set_cell_margins(c_refl, top=20, bottom=20, left=35, right=35)

    p_rt = c_refl.paragraphs[0]
    p_rt.paragraph_format.space_before = Pt(0)
    p_rt.paragraph_format.space_after = Pt(1)
    r_rt = p_rt.add_run("💡 気づいたこと・考察（密度の影響、増え方の違い、環境収容力など）")
    r_rt.font.size = Pt(8)
    r_rt.font.bold = True
    r_rt.font.color.rgb = RGBColor(0x2b, 0x6c, 0xb0)

    p_rp = c_refl.add_paragraph()
    p_rp.paragraph_format.space_before = Pt(0)
    p_rp.paragraph_format.space_after = Pt(3)
    r_rp = p_rp.add_run("【問いの例】 ① 通常環境と理想環境で増え方（グラフの曲線）はどう違ったか？ ② 最も急増した時期や頭打ちになった理由として何が考えられるか？")
    r_rp.font.size = Pt(6.5)
    r_rp.font.color.rgb = RGBColor(0x71, 0x80, 0x96)

    # 3 lines table for students to write notes
    ruled_tbl = c_refl.add_table(rows=3, cols=1)
    ruled_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    ruled_tbl.autofit = False
    for r_idx in range(3):
        r_row = ruled_tbl.rows[r_idx]
        prevent_row_split(r_row)
        set_row_height(r_row, 14)
        c_line = r_row.cells[0]
        c_line.width = Mm(186)
        set_cell_margins(c_line, top=0, bottom=0, left=0, right=0)
        set_cell_borders(c_line, bottom=('dashed', '4', 'A0AEC0'))
        p_blank = c_line.paragraphs[0]
        p_blank.paragraph_format.space_before = Pt(0)
        p_blank.paragraph_format.space_after = Pt(0)

    doc.save(output_path)
    print(f"Word worksheet saved successfully to {output_path}")

if __name__ == "__main__":
    out_dir = "/Users/takehirokubokawa/Library/CloudStorage/GoogleDrive-kubokawa@kawase2018.org/マイドライブ/Antigravity/Antigravity_Artifacts/bio_summer_apps"
    graph_img = f"{out_dir}/graph_grid_150.png"
    target_docx = f"{out_dir}/ふえるっち_30日間実験記録ワークシート.docx"
    build_docx(target_docx, graph_img)
