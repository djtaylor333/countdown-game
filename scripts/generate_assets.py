"""
Countdown Game – Play Store & Android asset generator
Produces:
  store-assets/
    icon-512.png                    Play Store icon (512×512)
    feature-graphic.png             Feature graphic (1024×500)
    screenshot-01-home.png          Phone screenshot 1 (1080×1920)
    screenshot-02-letters.png       Phone screenshot 2
    screenshot-03-playing.png       Phone screenshot 3
    screenshot-04-numbers.png       Phone screenshot 4
    screenshot-05-results.png       Phone screenshot 5
  android-app/app/src/main/res/
    mipmap-mdpi/ic_launcher.png        48×48
    mipmap-hdpi/ic_launcher.png        72×72
    mipmap-xhdpi/ic_launcher.png       96×96
    mipmap-xxhdpi/ic_launcher.png      144×144
    mipmap-xxxhdpi/ic_launcher.png     192×192
    mipmap-mdpi/ic_launcher_round.png  (same, circular crop)
    ...
  web-app/public/icons/
    icon-192.png
    icon-512.png
    apple-touch-icon.png            180×180
"""

from PIL import Image, ImageDraw, ImageFont
import os, math

# ── Brand colours ─────────────────────────────────────────────────────────────
BG_DEEP   = (7,   14,  28)      # #070e1c
BG_CARD   = (15,  31,  56)      # #0f1f38
BG_PANEL  = (22,  45,  80)      # #162d50
GOLD      = (246, 201, 14)      # #f6c90e
GOLD_DIM  = (180, 145, 10)
TILE_BG   = (26,  53,  96)      # #1a3560
TILE_BORD = (44,  95, 168)      # #2c5fa8
TEXT_PRI  = (255, 255, 255)
TEXT_SEC  = (148, 163, 184)     # #94a3b8
TEXT_MUT  = (71,  85, 105)      # #475569
SUCCESS   = (34,  197, 94)
WARNING   = (245, 158, 11)
NUM_LARGE = (30,  65, 118)      # #1e4176

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STORE   = os.path.join(BASE, "store-assets")
RES     = os.path.join(BASE, "android-app", "app", "src", "main", "res")
WEB_ICO = os.path.join(BASE, "web-app", "public", "icons")
os.makedirs(STORE, exist_ok=True)
os.makedirs(WEB_ICO, exist_ok=True)

# ── Font helpers ──────────────────────────────────────────────────────────────

def get_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    """Try several common system font paths; fall back to default."""
    bold_candidates = [
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/calibrib.ttf",
        "C:/Windows/Fonts/segoeuib.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    reg_candidates = [
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/calibri.ttf",
        "C:/Windows/Fonts/segoeui.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    candidates = bold_candidates if bold else reg_candidates
    for path in candidates:
        if os.path.isfile(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()


def draw_text_centered(draw, xy, text, font, fill):
    """Draw text centred on xy."""
    bbox = draw.textbbox((0, 0), text, font=font)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((xy[0] - w / 2, xy[1] - h / 2), text, font=font, fill=fill)


def rounded_rect(draw, xy, radius, fill, outline=None, width=2):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


# ── App icon drawing ──────────────────────────────────────────────────────────

def draw_icon(size: int) -> Image.Image:
    """
    Icon design:
    - Dark navy rounded-square background
    - Gold "C" large letter centred (stylised tile)
    - Small dot grid (·D·) below as sub-label
    - Subtle letter-tile grid pattern in background
    """
    scale = size / 512
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Background rounded square
    r = int(size * 0.18)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=BG_DEEP)

    # Subtle tile grid in background (3×3 faint tiles)
    tile_size = int(size * 0.22)
    gap = int(size * 0.04)
    grid_w = 3 * tile_size + 2 * gap
    ox = (size - grid_w) // 2
    oy = int(size * 0.52)
    for row in range(2):
        for col in range(3):
            x = ox + col * (tile_size + gap)
            y = oy + row * (tile_size + gap)
            d.rounded_rectangle(
                [x, y, x + tile_size, y + tile_size],
                radius=int(tile_size * 0.15),
                fill=TILE_BG,
                outline=TILE_BORD,
                width=max(1, int(scale * 2))
            )

    # Main large "C" tile centred-upper
    main_tile = int(size * 0.58)
    mx = (size - main_tile) // 2
    my = int(size * 0.06)
    d.rounded_rectangle(
        [mx, my, mx + main_tile, my + main_tile],
        radius=int(main_tile * 0.16),
        fill=TILE_BG,
        outline=GOLD,
        width=max(2, int(scale * 5))
    )

    # "C" letter
    font_c = get_font(int(size * 0.52), bold=True)
    cx, cy = size // 2, my + main_tile // 2 - int(size * 0.01)
    draw_text_centered(d, (cx, cy), "C", font_c, GOLD)

    # "COUNTDOWN" label at bottom
    font_sub = get_font(int(size * 0.07), bold=True)
    draw_text_centered(d, (size // 2, int(size * 0.93)), "COUNTDOWN", font_sub, TEXT_SEC)

    return img


def save_icon(size: int, path: str, circular: bool = False):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img = draw_icon(size)
    if circular:
        # Apply circular mask
        mask = Image.new("L", (size, size), 0)
        md = ImageDraw.Draw(mask)
        md.ellipse([0, 0, size - 1, size - 1], fill=255)
        img.putalpha(mask)
    img.save(path, "PNG")
    print(f"  ✓ {os.path.relpath(path, BASE)}  ({size}×{size})")


# ── Screenshot helpers ────────────────────────────────────────────────────────

W, H = 1080, 1920   # Portrait phone

def new_screen() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGB", (W, H), BG_DEEP)
    d = ImageDraw.Draw(img)
    # Subtle gradient: slightly lighter at top
    for y in range(H // 2):
        alpha = int(20 * (1 - y / (H // 2)))
        r = min(255, BG_PANEL[0] + alpha)
        g = min(255, BG_PANEL[1] + alpha)
        b = min(255, BG_PANEL[2] + alpha)
        d.line([(0, y), (W, y)], fill=(r, g, b))
    return img, d


def status_bar(d, y=60):
    """Draw a minimal status bar."""
    font = get_font(28)
    d.text((60, y - 18), "9:41", font=font, fill=TEXT_SEC)
    d.text((W - 160, y - 18), "●●●  ▶", font=font, fill=TEXT_SEC)


def draw_card(d, x, y, w, h, radius=24, fill=BG_CARD, outline=None, outline_w=2):
    d.rounded_rectangle([x, y, x + w, y + h], radius=radius,
                         fill=fill, outline=outline, width=outline_w)


def letter_tile(d, cx, cy, letter, size=84, selected=False):
    half = size // 2
    fill   = (55, 65, 81) if selected else TILE_BG
    border = TEXT_SEC if selected else TILE_BORD
    color  = TEXT_SEC if selected else TEXT_PRI
    d.rounded_rectangle(
        [cx - half, cy - half, cx + half, cy + half],
        radius=10, fill=fill, outline=border, width=3
    )
    f = get_font(int(size * 0.55), bold=True)
    draw_text_centered(d, (cx, cy), letter, f, color)


def number_tile(d, cx, cy, number, large=False, w=130, h=100):
    fill   = NUM_LARGE if large else TILE_BG
    border = GOLD if large else TILE_BORD
    color  = GOLD if large else TEXT_PRI
    d.rounded_rectangle(
        [cx - w//2, cy - h//2, cx + w//2, cy + h//2],
        radius=12, fill=fill, outline=border, width=3
    )
    f = get_font(44, bold=True)
    draw_text_centered(d, (cx, cy), str(number), f, color)


def app_header(d, round_label="Letters 1", time_left=None):
    """Top bar with home icon placeholder, round label, timer."""
    # home icon circle
    d.ellipse([54, 80, 106, 132], fill=BG_PANEL)
    f_home = get_font(34)
    draw_text_centered(d, (80, 106), "⌂", f_home, TEXT_SEC)
    # Round label
    f_label = get_font(44, bold=True)
    draw_text_centered(d, (W // 2, 106), round_label, f_label, GOLD)
    # Timer
    if time_left is not None:
        color = (34, 197, 94) if time_left > 20 else (245, 158, 11) if time_left > 10 else (239, 68, 68)
        f_timer = get_font(60, bold=True)
        draw_text_centered(d, (W - 90, 106), str(time_left), f_timer, color)
    # Divider
    d.line([(0, 148), (W, 148)], fill=BG_PANEL, width=3)


# ── Screenshot 1: Home screen ─────────────────────────────────────────────────

def screenshot_home():
    img, d = new_screen()
    status_bar(d)

    # App title
    f_title = get_font(96, bold=True)
    draw_text_centered(d, (W // 2, 200), "COUNTDOWN", f_title, GOLD)
    f_sub = get_font(38)
    draw_text_centered(d, (W // 2, 280), "Daily Puzzle", f_sub, TEXT_SEC)
    f_date = get_font(32)
    draw_text_centered(d, (W // 2, 330), "Monday, 9 March 2026", f_date, TEXT_MUT)

    # Streak cards
    card_y = 400
    for i, (emoji, val, label) in enumerate([("🔥", "7", "Play Streak"), ("⭐", "3", "Perfect Streak")]):
        cx = 280 if i == 0 else W - 280
        draw_card(d, cx - 220, card_y, 440, 220, fill=BG_CARD)
        f_em = get_font(64)
        draw_text_centered(d, (cx, card_y + 60), emoji, f_em, GOLD)
        f_val = get_font(80, bold=True)
        draw_text_centered(d, (cx, card_y + 145), val, f_val, GOLD)
        f_lbl = get_font(30)
        draw_text_centered(d, (cx, card_y + 195), label, f_lbl, TEXT_SEC)

    # Today's puzzle card
    py = 680
    draw_card(d, 60, py, W - 120, 260, fill=BG_CARD)
    f_card_hdr = get_font(34, bold=True)
    d.text((100, py + 24), "TODAY'S PUZZLE", font=f_card_hdr, fill=TEXT_SEC)
    f_row = get_font(32)
    for i, (lbl, txt) in enumerate([
        ("Letters 1", "S  T  A  R  G  A  Z  I  N"),
        ("Letters 2", "B  R  E  A  K  T  H  R  U"),
        ("Numbers",   "75 · 50 · 6 · 3 · 9 · 2   →  943"),
    ]):
        ry = py + 78 + i * 58
        d.text((100, ry), lbl, font=get_font(28), fill=TEXT_MUT)
        d.text((280, ry), txt, font=f_row, fill=TEXT_PRI)

    # Play button
    btn_y = 1020
    d.rounded_rectangle([120, btn_y, W - 120, btn_y + 120], radius=24, fill=GOLD)
    f_btn = get_font(56, bold=True)
    draw_text_centered(d, (W // 2, btn_y + 60), "▶   Play Today", f_btn, BG_DEEP)

    # View Results outlined button
    d.rounded_rectangle([120, btn_y + 148, W - 120, btn_y + 248], radius=24,
                         outline=GOLD, width=3, fill=BG_DEEP)
    draw_text_centered(d, (W // 2, btn_y + 198), "View Results", get_font(48), GOLD)

    # Mode buttons
    my = btn_y + 310
    f_mode = get_font(38)
    draw_text_centered(d, (W // 2, my + 10), "MORE MODES", get_font(28), TEXT_MUT)
    for j, label in enumerate(["🎯  Practice Mode (No Timer)", "🏆  Full Game (9 Rounds)"]):
        ly = my + 60 + j * 90
        d.rounded_rectangle([120, ly, W - 120, ly + 70], radius=20,
                             outline=TEXT_MUT, width=2, fill=BG_DEEP)
        draw_text_centered(d, (W // 2, ly + 35), label, f_mode, TEXT_PRI)

    return img


# ── Screenshot 2: Letter selection ────────────────────────────────────────────

def screenshot_letters_select():
    img, d = new_screen()
    status_bar(d)
    app_header(d, "Letters 1")

    # Prompt
    f_p = get_font(44)
    draw_text_centered(d, (W // 2, 240), "Your 9 Letters", f_p, TEXT_SEC)

    # 9 letter tiles in a row
    letters = ["S", "T", "A", "R", "G", "A", "Z", "I", "N"]
    tile_s = 94
    gap = 10
    total_w = len(letters) * tile_s + (len(letters) - 1) * gap
    sx = (W - total_w) // 2
    ty = 340
    for i, ch in enumerate(letters):
        cx = sx + i * (tile_s + gap) + tile_s // 2
        letter_tile(d, cx, ty + tile_s // 2, ch, size=tile_s)

    # Word builder card
    draw_card(d, 60, 480, W - 120, 110, fill=BG_CARD)
    f_word = get_font(64, bold=True)
    draw_text_centered(d, (W // 2, 536), "STAR", f_word, GOLD)

    # Clear / Stop Clock buttons
    d.rounded_rectangle([80, 630, 480, 720], radius=20, outline=TEXT_MUT, width=2, fill=BG_DEEP)
    draw_text_centered(d, (280, 675), "Clear", get_font(40), TEXT_SEC)
    d.rounded_rectangle([520, 630, W - 80, 720], radius=20, fill=GOLD)
    draw_text_centered(d, (W - 80 - 280, 675), "Stop Clock", get_font(40, bold=True), BG_DEEP)

    # Score card placeholder
    draw_card(d, 60, 780, W - 120, 200, fill=BG_CARD, outline=TILE_BORD, outline_w=2)
    f_hint = get_font(36)
    draw_text_centered(d, (W // 2, 848), "Tap tiles to build your word", f_hint, TEXT_MUT)
    draw_text_centered(d, (W // 2, 900), "or type on your keyboard", f_hint, TEXT_MUT)

    # Timer bar at bottom
    timer_y = 1720
    timer_w = int((W - 120) * 0.72)
    d.rounded_rectangle([60, timer_y, 60 + W - 120, timer_y + 16], radius=8, fill=BG_PANEL)
    d.rounded_rectangle([60, timer_y, 60 + timer_w, timer_y + 16], radius=8, fill=SUCCESS)
    f_timer = get_font(40, bold=True)
    draw_text_centered(d, (W // 2, timer_y + 50), "43 seconds remaining", f_timer, SUCCESS)

    return img


# ── Screenshot 3: Letters playing mid-game ────────────────────────────────────

def screenshot_letters_playing():
    img, d = new_screen()
    status_bar(d)
    app_header(d, "Letters 2", time_left=28)

    # 9 tiles — some used
    letters  = ["B", "R", "E", "A", "K", "T", "H", "R", "U"]
    used     = {0, 1, 2, 4}
    tile_s = 94
    gap = 10
    total_w = len(letters) * tile_s + (len(letters) - 1) * gap
    sx = (W - total_w) // 2
    ty = 260
    for i, ch in enumerate(letters):
        cx = sx + i * (tile_s + gap) + tile_s // 2
        letter_tile(d, cx, ty + tile_s // 2, ch, size=tile_s, selected=(i in used))

    # Word builder — current word
    draw_card(d, 60, 410, W - 120, 110, fill=BG_CARD)
    f_word = get_font(66, bold=True)
    draw_text_centered(d, (W // 2 - 40, 466), "BARK", f_word, GOLD)
    # Backspace hint
    d.text((W - 180, 440), "⌫", font=get_font(50), fill=TEXT_SEC)

    # Buttons
    d.rounded_rectangle([80, 570, 480, 660], radius=20, outline=TEXT_MUT, width=2, fill=BG_DEEP)
    draw_text_centered(d, (280, 615), "Clear", get_font(40), TEXT_SEC)
    d.rounded_rectangle([520, 570, W - 80, 660], radius=20, fill=GOLD)
    draw_text_centered(d, (W - 80 - 280, 615), "Stop Clock", get_font(40, bold=True), BG_DEEP)

    # Best words hint
    draw_card(d, 60, 720, W - 120, 200, fill=BG_CARD)
    f_hint = get_font(36)
    draw_text_centered(d, (W // 2, 785), "Tip: longer words score more!", f_hint, TEXT_MUT)
    draw_text_centered(d, (W // 2, 840), "A 9-letter word scores 18 pts 🏆", f_hint, TEXT_MUT)

    # Timer critical
    timer_y = 1720
    timer_w = int((W - 120) * 0.47)
    d.rounded_rectangle([60, timer_y, 60 + W - 120, timer_y + 16], radius=8, fill=BG_PANEL)
    d.rounded_rectangle([60, timer_y, 60 + timer_w, timer_y + 16], radius=8, fill=WARNING)
    draw_text_centered(d, (W // 2, timer_y + 50), "28 seconds remaining", get_font(40, bold=True), WARNING)

    return img


# ── Screenshot 4: Numbers round ───────────────────────────────────────────────

def screenshot_numbers():
    img, d = new_screen()
    status_bar(d)
    app_header(d, "Numbers", time_left=19)

    # Target
    draw_card(d, 60, 180, W - 120, 180, fill=BG_CARD)
    f_tgt_lbl = get_font(36)
    draw_text_centered(d, (W // 2, 225), "TARGET", f_tgt_lbl, TEXT_SEC)
    f_tgt = get_font(110, bold=True)
    draw_text_centered(d, (W // 2, 315), "843", f_tgt, GOLD)

    # 6 number tiles
    nums   = [75, 50, 6, 3, 9, 2]
    large  = {75, 50}
    tile_w = 148
    tile_h = 100
    gap    = 12
    total  = len(nums) * tile_w + (len(nums) - 1) * gap
    sx     = (W - total) // 2
    ty     = 430
    for i, n in enumerate(nums):
        cx = sx + i * (tile_w + gap) + tile_w // 2
        number_tile(d, cx, ty + tile_h // 2, n, large=(n in large), w=tile_w, h=tile_h)

    # Operator buttons
    ops = ["+", "−", "×", "÷"]
    op_w = (W - 120 - 3 * 16) // 4
    oy = 590
    for i, op in enumerate(ops):
        ox = 60 + i * (op_w + 16)
        active = (i == 2)
        d.rounded_rectangle([ox, oy, ox + op_w, oy + 84], radius=12,
                             fill=GOLD if active else BG_CARD,
                             outline=GOLD if active else TILE_BORD, width=2)
        draw_text_centered(d, (ox + op_w // 2, oy + 42), op,
                           get_font(52, bold=True), BG_DEEP if active else GOLD)

    # Equation steps
    draw_card(d, 60, 730, W - 120, 220, fill=BG_CARD)
    steps = [
        "75  ×  9  =  675",
        "675  +  6  ×  3  =  693",
    ]
    f_step = get_font(38)
    for i, s in enumerate(steps):
        col = GOLD if i == len(steps) - 1 else TEXT_PRI
        draw_text_centered(d, (W // 2, 790 + i * 70), s, f_step, col)

    # Undo / Clear / Stop buttons
    for j, (lbl, fill_, fcol) in enumerate([
        ("Undo", BG_DEEP, TEXT_SEC),
        ("Clear", BG_DEEP, TEXT_SEC),
        ("Stop Clock", GOLD, BG_DEEP),
    ]):
        bw = (W - 120 - 2 * 16) // 3
        bx = 60 + j * (bw + 16)
        d.rounded_rectangle([bx, 1010, bx + bw, 1100], radius=18,
                             fill=fill_, outline=TEXT_MUT if fill_ == BG_DEEP else None, width=2)
        draw_text_centered(d, (bx + bw // 2, 1055), lbl, get_font(36, bold=(fill_==GOLD)), fcol)

    # Timer critical
    timer_y = 1720
    timer_w = int((W - 120) * 0.32)
    d.rounded_rectangle([60, timer_y, 60 + W - 120, timer_y + 16], radius=8, fill=BG_PANEL)
    d.rounded_rectangle([60, timer_y, 60 + timer_w, timer_y + 16], radius=8,
                         fill=(239, 68, 68))
    draw_text_centered(d, (W // 2, timer_y + 50), "19 seconds remaining",
                       get_font(40, bold=True), (239, 68, 68))

    return img


# ── Screenshot 5: Final score ─────────────────────────────────────────────────

def screenshot_results():
    img, d = new_screen()
    status_bar(d)

    # Header
    f_ew = get_font(80)
    draw_text_centered(d, (W // 2, 190), "🏆", f_ew, GOLD)
    f_hdr = get_font(72, bold=True)
    draw_text_centered(d, (W // 2, 290), "Today's Results", f_hdr, GOLD)
    f_date = get_font(34)
    draw_text_centered(d, (W // 2, 354), "Monday, 9 March 2026", f_date, TEXT_SEC)

    # Big score
    draw_card(d, 60, 410, W - 120, 220, fill=BG_CARD)
    f_score = get_font(130, bold=True)
    draw_text_centered(d, (W // 2, 495), "37", f_score, GOLD)
    draw_text_centered(d, (W // 2, 595), "out of 46 pts", get_font(38), TEXT_SEC)
    # Progress bar
    bar_x, bar_y = 100, 618
    bar_w = W - 200
    d.rounded_rectangle([bar_x, bar_y, bar_x + bar_w, bar_y + 20], radius=10, fill=BG_PANEL)
    fill_w = int(bar_w * 37 / 46)
    d.rounded_rectangle([bar_x, bar_y, bar_x + fill_w, bar_y + 20], radius=10, fill=GOLD)

    # Round breakdown cards
    rounds = [
        ("Letters Round 1", "STARING  (7 pts)", 7, 9),
        ("Letters Round 2", "BREAK  (5 pts)",   5, 9),
        ("Numbers Round",   "843 — Exact!",     10, 10),
    ]
    ry = 700
    for title, detail, score, max_s in rounds:
        draw_card(d, 60, ry, W - 120, 130, fill=BG_CARD)
        d.text((100, ry + 22), title, font=get_font(34, bold=True), fill=TEXT_PRI)
        d.text((100, ry + 66), detail, font=get_font(34), fill=GOLD)
        col = SUCCESS if score == max_s else WARNING
        f_sc = get_font(44, bold=True)
        tw = d.textbbox((0,0), f"{score}/{max_s}", font=f_sc)
        d.text((W - 100 - (tw[2]-tw[0]), ry + 45), f"{score}/{max_s}", font=f_sc, fill=col)
        ry += 150

    # Streak chips
    cy2 = ry + 10
    for i, (em, val, lbl) in enumerate([("🔥", "7 days", "Play Streak"), ("⭐", "4 days", "Best Streak")]):
        cx = 280 if i == 0 else W - 280
        draw_card(d, cx - 210, cy2, 420, 160, fill=BG_CARD)
        draw_text_centered(d, (cx, cy2 + 40), em, get_font(50), GOLD)
        draw_text_centered(d, (cx, cy2 + 85), val, get_font(44, bold=True), GOLD)
        draw_text_centered(d, (cx, cy2 + 128), lbl, get_font(28), TEXT_SEC)

    # Back button
    btn_y = cy2 + 206
    d.rounded_rectangle([120, btn_y, W - 120, btn_y + 100], radius=20,
                         outline=GOLD, width=3, fill=BG_DEEP)
    draw_text_centered(d, (W // 2, btn_y + 50), "← Back to Home", get_font(46), GOLD)

    return img


# ── Feature graphic ───────────────────────────────────────────────────────────

def feature_graphic() -> Image.Image:
    FW, FH = 1024, 500
    img = Image.new("RGB", (FW, FH), BG_DEEP)
    d = ImageDraw.Draw(img)

    # Gradient bands
    for y in range(FH):
        t = y / FH
        r = int(BG_DEEP[0] + (BG_PANEL[0] - BG_DEEP[0]) * t * 0.5)
        g = int(BG_DEEP[1] + (BG_PANEL[1] - BG_DEEP[1]) * t * 0.5)
        b = int(BG_DEEP[2] + (BG_PANEL[2] - BG_DEEP[2]) * t * 0.5)
        d.line([(0, y), (FW, y)], fill=(r, g, b))

    # Left side: letter tiles
    tile_chars = ["C", "O", "U", "N", "T"]
    ts = 74
    gap = 10
    lx = 60
    ty = (FH - (ts + gap) * len(tile_chars) + gap) // 2
    for i, ch in enumerate(tile_chars):
        cy = ty + i * (ts + gap) + ts // 2
        d.rounded_rectangle(
            [lx, cy - ts//2, lx + ts, cy + ts//2],
            radius=10, fill=TILE_BG, outline=TILE_BORD, width=2
        )
        draw_text_centered(d, (lx + ts // 2, cy), ch, get_font(int(ts * 0.65), bold=True), GOLD)

    # Right side: number tiles
    num_data = [(75, True), (50, True), (6, False), (3, False)]
    nw, nh = 110, 72
    rx = FW - 60 - nw
    ny_start = (FH - (nh + gap) * len(num_data) + gap) // 2
    for i, (n, large) in enumerate(num_data):
        cy = ny_start + i * (nh + gap) + nh // 2
        fill   = NUM_LARGE if large else TILE_BG
        border = GOLD if large else TILE_BORD
        color  = GOLD if large else TEXT_PRI
        d.rounded_rectangle(
            [rx, cy - nh//2, rx + nw, cy + nh//2],
            radius=10, fill=fill, outline=border, width=2
        )
        draw_text_centered(d, (rx + nw // 2, cy), str(n), get_font(38, bold=True), color)

    # Centre: title
    f_main = get_font(120, bold=True)
    draw_text_centered(d, (FW // 2, 180), "COUNTDOWN", f_main, GOLD)
    f_sub = get_font(44)
    draw_text_centered(d, (FW // 2, 265), "Daily Word & Numbers Puzzle", f_sub, TEXT_SEC)

    # Gold divider line
    d.line([(FW//2 - 200, 300), (FW//2 + 200, 300)], fill=GOLD, width=3)

    # Tagline
    f_tag = get_font(34)
    draw_text_centered(d, (FW // 2, 340), "Letters · Numbers · Daily Challenge", f_tag, TEXT_MUT)

    # Target number teaser
    draw_card(d, FW//2 - 160, 378, 320, 80, radius=16, fill=BG_CARD, outline=TILE_BORD, outline_w=2)
    draw_text_centered(d, (FW // 2, 418), "Target:  843", get_font(38, bold=True), GOLD)

    return img


# ── Main generation ───────────────────────────────────────────────────────────

def main():
    print("\n=== Countdown Game Asset Generator ===\n")

    # ── App icons ─────────────────────────────────────────────────────────────
    print("App icons:")

    # Play Store 512×512
    save_icon(512, os.path.join(STORE, "icon-512.png"))

    # Android mipmap PNGs
    densities = {
        "mipmap-mdpi":    48,
        "mipmap-hdpi":    72,
        "mipmap-xhdpi":   96,
        "mipmap-xxhdpi":  144,
        "mipmap-xxxhdpi": 192,
    }
    for folder, size in densities.items():
        dir_path = os.path.join(RES, folder)
        save_icon(size, os.path.join(dir_path, "ic_launcher.png"))
        save_icon(size, os.path.join(dir_path, "ic_launcher_round.png"), circular=True)

    # PWA icons
    save_icon(192, os.path.join(WEB_ICO, "icon-192.png"))
    save_icon(512, os.path.join(WEB_ICO, "icon-512.png"))
    save_icon(180, os.path.join(WEB_ICO, "apple-touch-icon.png"), circular=False)

    # ── Feature graphic ───────────────────────────────────────────────────────
    print("\nFeature graphic:")
    fg = feature_graphic()
    path = os.path.join(STORE, "feature-graphic.png")
    fg.save(path)
    print(f"  ✓ store-assets/feature-graphic.png  (1024×500)")

    # ── Screenshots ───────────────────────────────────────────────────────────
    print("\nScreenshots (1080×1920):")
    shots = [
        ("screenshot-01-home.png",           screenshot_home),
        ("screenshot-02-letters-select.png", screenshot_letters_select),
        ("screenshot-03-letters-playing.png",screenshot_letters_playing),
        ("screenshot-04-numbers.png",        screenshot_numbers),
        ("screenshot-05-results.png",        screenshot_results),
    ]
    for filename, fn in shots:
        img = fn()
        path = os.path.join(STORE, filename)
        img.save(path)
        print(f"  ✓ store-assets/{filename}  (1080×1920)")

    print(f"\n✅  All assets generated in:")
    print(f"   {STORE}")
    print(f"   {os.path.join(RES, 'mipmap-*')}")
    print(f"   {WEB_ICO}")


if __name__ == "__main__":
    main()
