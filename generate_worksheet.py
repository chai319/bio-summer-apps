#!/usr/bin/env python3
import os

html_content = """<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>ふえるっち 30日間実験記録ワークシート（個体群の成長と密度効果）</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 7mm 9mm 7mm 9mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif;
      color: #1a202c;
      background: #ffffff;
      width: 192mm;
      margin: 0 auto;
      font-size: 8.5pt;
      line-height: 1.25;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Print Bar */
    .print-bar {
      text-align: right;
      margin-bottom: 5px;
    }
    .btn-print {
      background: #3182ce;
      color: #fff;
      border: none;
      padding: 5px 14px;
      font-size: 9pt;
      font-weight: bold;
      border-radius: 4px;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    }
    @media print {
      .print-bar {
        display: none !important;
      }
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 2px solid #2d3748;
      padding-bottom: 3px;
      margin-bottom: 5px;
    }
    .header-title h1 {
      font-size: 13pt;
      font-weight: 800;
      letter-spacing: -0.3px;
      color: #1a202c;
    }
    .header-title p {
      font-size: 7.5pt;
      color: #4a5568;
      margin-top: 1px;
    }
    .student-info {
      display: flex;
      gap: 6px;
      align-items: center;
      font-size: 9pt;
      font-weight: bold;
      white-space: nowrap;
    }
    .info-box {
      border-bottom: 1.5px solid #2d3748;
      padding: 0 4px;
      min-width: 28px;
      height: 18px;
      text-align: center;
    }
    .name-box {
      min-width: 130px;
      text-align: left;
    }

    /* Experiment Section */
    .experiment-section {
      border: 1.5px solid #2d3748;
      border-radius: 4px;
      padding: 4px 6px;
      margin-bottom: 5px;
      background: #fff;
    }
    .exp-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #edf2f7;
      padding: 2.5px 6px;
      border-radius: 3px;
      margin-bottom: 4px;
      border-left: 4px solid #3182ce;
    }
    .exp-title {
      font-size: 8.5pt;
      font-weight: 800;
      color: #2b6cb0;
      white-space: nowrap;
    }
    .exp-conditions {
      display: flex;
      gap: 4px;
      font-size: 7pt;
      font-weight: bold;
      color: #2d3748;
      align-items: center;
      white-space: nowrap;
    }
    .condition-tag {
      background: #fff;
      border: 1px solid #cbd5e0;
      padding: 1px 3px;
      border-radius: 3px;
    }

    .exp-body {
      display: flex;
      gap: 8px;
    }

    /* 30-Day Table */
    .table-container {
      width: 70mm;
      flex-shrink: 0;
    }
    .split-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.5pt;
      text-align: center;
    }
    .split-table th {
      background: #e2e8f0;
      border: 1px solid #718096;
      padding: 1.5px 1px;
      font-weight: bold;
    }
    .split-table td {
      border: 1px solid #a0aec0;
      padding: 1px 1px;
      height: 15px;
    }
    .col-day {
      background: #f7fafc;
      font-weight: bold;
      width: 18%;
    }
    .col-val {
      width: 32%;
    }

    /* Graph Canvas Area */
    .graph-container {
      flex: 1;
      border: 1px solid #a0aec0;
      border-radius: 3px;
      padding: 3px 6px 2px 6px;
      display: flex;
      flex-direction: column;
      background: #ffffff;
    }
    .graph-title {
      font-size: 7.5pt;
      font-weight: bold;
      color: #2d3748;
      display: flex;
      justify-content: space-between;
      margin-bottom: 1px;
    }
    .graph-svg-wrap {
      width: 100%;
      height: 72mm;
    }
    svg {
      width: 100%;
      height: 100%;
      display: block;
    }

    /* Reflection Section */
    .reflection-section {
      border: 1.5px solid #2d3748;
      border-radius: 4px;
      padding: 5px 8px;
      background: #fff;
    }
    .reflection-title {
      font-size: 8.5pt;
      font-weight: 800;
      color: #2b6cb0;
      margin-bottom: 2px;
      display: flex;
      justify-content: space-between;
    }
    .reflection-prompts {
      font-size: 7.5pt;
      color: #4a5568;
      margin-bottom: 4px;
      line-height: 1.3;
    }
    .ruled-lines {
      width: 100%;
    }
    .ruled-line {
      height: 20px;
      border-bottom: 1px dashed #a0aec0;
    }
  </style>
</head>
<body>

  <!-- Print Button for Browser view -->
  <div class="print-bar">
    <button class="btn-print" onclick="window.print()">🖨️ A4 1枚で印刷する（Cmd+P / Ctrl+P）</button>
  </div>

  <!-- Header -->
  <header class="header">
    <div class="header-title">
      <h1>高校生物 実習プリント：個体群の成長と密度効果「ふえるっち」実験シート</h1>
      <p>【シミュレーター公開URL】 https://chai319.github.io/bio-summer-apps/fuerutchi_growth_sim.html</p>
    </div>
    <div class="student-info">
      <span>年</span><div class="info-box"></div>
      <span>組</span><div class="info-box"></div>
      <span>番</span><div class="info-box"></div>
      <span>氏名:</span><div class="info-box name-box"></div>
    </div>
  </header>

  <!-- ==================== EXPERIMENT 1 ==================== -->
  <section class="experiment-section">
    <div class="exp-header">
      <span class="exp-title">【実験 1】 通常環境（環境抵抗あり・S字型成長曲線）</span>
      <div class="exp-conditions">
        <span class="condition-tag">キャラ［　　　　］</span>
        <span class="condition-tag">① エサ［ 30 / 60 / 120 ］pt</span>
        <span class="condition-tag">② 広さ［ 30 / 60 / 120 ］匹</span>
        <span class="condition-tag">③ 清掃［ こまめ / サボり ］</span>
      </div>
    </div>

    <div class="exp-body">
      <!-- 30-Day Table (15 rows x 2 cols) -->
      <div class="table-container">
        <table class="split-table">
          <thead>
            <tr>
              <th class="col-day">日数</th>
              <th class="col-val">個体数</th>
              <th class="col-day">日数</th>
              <th class="col-val">個体数</th>
            </tr>
          </thead>
          <tbody>"""

for i in range(1, 16):
    d_left = i
    d_right = i + 15
    html_content += f"""
            <tr>
              <td class="col-day">{d_left}日</td>
              <td class="col-val"></td>
              <td class="col-day">{d_right}日</td>
              <td class="col-val"></td>
            </tr>"""

def generate_svg():
    svg = """
        <div class="graph-svg-wrap">
          <svg viewBox="0 0 395 195">
            <!-- Background Grid (15 divisions vertically = 10 units each, 30 days horizontally) -->
            <defs>
              <pattern id="subgrid" width="11" height="10" patternUnits="userSpaceOnUse">
                <path d="M 11 0 L 0 0 0 10" fill="none" stroke="#f0f4f8" stroke-width="0.6"/>
              </pattern>
            </defs>
            <rect x="45" y="25" width="330" height="150" fill="url(#subgrid)" stroke="#cbd5e0" stroke-width="1"/>
            
            <!-- Major Horizontal Lines (50 and 100) -->
            <line x1="45" y1="125" x2="375" y2="125" stroke="#cbd5e0" stroke-width="0.8" stroke-dasharray="2,2"/>
            <line x1="45" y1="75" x2="375" y2="75" stroke="#cbd5e0" stroke-width="0.8" stroke-dasharray="2,2"/>

            <!-- Axes -->
            <line x1="45" y1="175" x2="375" y2="175" stroke="#2d3748" stroke-width="1.5"/>
            <line x1="45" y1="25" x2="45" y2="175" stroke="#2d3748" stroke-width="1.5"/>

            <!-- Y Axis Label & Tick Marks (0, 50, 100, 150) -->
            <text x="42" y="15" font-size="7.5" font-weight="bold" text-anchor="start" fill="#2d3748">個体数 (匹)</text>

            <line x1="40" y1="25" x2="45" y2="25" stroke="#2d3748" stroke-width="1.2"/>
            <text x="38" y="27" font-size="6.5" font-weight="bold" text-anchor="end" fill="#2d3748">150</text>

            <line x1="40" y1="75" x2="45" y2="75" stroke="#2d3748" stroke-width="1.2"/>
            <text x="38" y="77" font-size="6.5" font-weight="bold" text-anchor="end" fill="#2d3748">100</text>

            <line x1="40" y1="125" x2="45" y2="125" stroke="#2d3748" stroke-width="1.2"/>
            <text x="38" y="127" font-size="6.5" font-weight="bold" text-anchor="end" fill="#2d3748">50</text>

            <line x1="40" y1="175" x2="45" y2="175" stroke="#2d3748" stroke-width="1.2"/>
            <text x="38" y="177" font-size="6.5" font-weight="bold" text-anchor="end" fill="#2d3748">0</text>
"""
    # X-axis tick marks and labels (1 to 30)
    for d in range(1, 31):
        x = 45 + (d * 11)
        if d in [1, 5, 10, 15, 20, 25, 30]:
            svg += f'            <line x1="{x}" y1="175" x2="{x}" y2="179" stroke="#2d3748" stroke-width="1"/>\n'
            svg += f'            <text x="{x}" y="186" font-size="6.5" font-weight="bold" text-anchor="middle" fill="#2d3748">{d}</text>\n'
        else:
            svg += f'            <line x1="{x}" y1="175" x2="{x}" y2="177" stroke="#a0aec0" stroke-width="0.6"/>\n'

    svg += """            <text x="378" y="188" font-size="7" font-weight="bold" text-anchor="start" fill="#2d3748">日数</text>
          </svg>
        </div>"""
    return svg

html_content += f"""
          </tbody>
        </table>
      </div>

      <!-- Graph Area (SVG Grid) -->
      <div class="graph-container">
        <div class="graph-title">
          <span>📈 成長曲線グラフ（日ごとの個体数をプロットして線で結ぼう）</span>
          <span style="font-size: 7pt; color: #718096;">※y軸の目盛り数値は自分で決めて記入しよう</span>
        </div>
{generate_svg()}
      </div>
    </div>
  </section>

  <!-- ==================== EXPERIMENT 2 ==================== -->
  <section class="experiment-section">
    <div class="exp-header" style="border-left-color: #e53e3e;">
      <span class="exp-title" style="color: #c53030;">【実験 2】 理想環境（環境抵抗ゼロ・J字型成長曲線）または 条件変更</span>
      <div class="exp-conditions">
        <span class="condition-tag">キャラ［　　　　］</span>
        <span class="condition-tag">① エサ［ 無限 /　　］</span>
        <span class="condition-tag">② 広さ［ 無限 /　　］</span>
        <span class="condition-tag">③ 清掃［ うんち無 /　　］</span>
      </div>
    </div>

    <div class="exp-body">
      <!-- 30-Day Table (15 rows x 2 cols) -->
      <div class="table-container">
        <table class="split-table">
          <thead>
            <tr>
              <th class="col-day">日数</th>
              <th class="col-val">個体数</th>
              <th class="col-day">日数</th>
              <th class="col-val">個体数</th>
            </tr>
          </thead>
          <tbody>"""

for i in range(1, 16):
    d_left = i
    d_right = i + 15
    html_content += f"""
            <tr>
              <td class="col-day">{d_left}日</td>
              <td class="col-val"></td>
              <td class="col-day">{d_right}日</td>
              <td class="col-val"></td>
            </tr>"""

html_content += f"""
          </tbody>
        </table>
      </div>

      <!-- Graph Area (SVG Grid) -->
      <div class="graph-container">
        <div class="graph-title">
          <span>📈 成長曲線グラフ（日ごとの個体数をプロットして線で結ぼう）</span>
          <span style="font-size: 7pt; color: #718096;">※y軸の目盛り数値は自分で決めて記入しよう</span>
        </div>
{generate_svg()}
      </div>
    </div>
  </section>

  <!-- ==================== REFLECTION SECTION ==================== -->
  <section class="reflection-section">
    <div class="reflection-title">
      <span>💡 気づいたこと・考察（密度の影響、増え方の違い、環境収容力など）</span>
      <span style="font-size: 7.5pt; color: #718096; font-weight: normal;">※自分の言葉で発見や疑問を自由に書こう</span>
    </div>
    <div class="reflection-prompts">
      【問いの例】 ① 実験1（通常）と実験2（理想）で、個体数の増え方（グラフの曲線のかたち）はどう違ったか？<br>
      ② 最も急激に増えた時期（傾きが急な時期）や、増加が止まった（頭打ちになった）理由として何が考えられるか？
    </div>
    <div class="ruled-lines">
      <div class="ruled-line"></div>
      <div class="ruled-line"></div>
      <div class="ruled-line"></div>
      <div class="ruled-line"></div>
    </div>
  </section>

</body>
</html>
"""

target_path = "/Users/takehirokubokawa/Library/CloudStorage/GoogleDrive-kubokawa@kawase2018.org/マイドライブ/Antigravity/Antigravity_Artifacts/bio_summer_apps/fuerutchi_worksheet.html"
with open(target_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"Written successfully to {target_path}")
