"""True Worship logo generator.

Design: a white cross on a deep blue rounded square, with light rays
fanning out behind the cross. The cross is worship; the rays are the
projector light. Flat, geometric, no gradients-on-text, so it stays
legible at 16px in a taskbar and on a church screen.

Outputs (all under assets/logo/):
  true-worship-icon-1024.png  app icon, rounded square
  true-worship-icon-512.png   app icon, also used as Electron window icon
  true-worship-icon-192.png   small icon
  true-worship-mark-transparent.png  cross + rays on transparent, for dark UI
  logo-horizontal-dark.png    icon + wordmark, dark text (light backgrounds)
  logo-horizontal-light.png   icon + wordmark, white text (dark backgrounds)
  true-worship-logo.svg       vector master (same geometry, hand written)
"""

from PIL import Image, ImageDraw, ImageFont

OUT = "assets/logo"
BLUE_TOP = (30, 64, 175)      # brand blue #1E40AF
BLUE_BOTTOM = (30, 58, 138)   # dark blue #1E3A8A
CYAN = (6, 182, 212)          # accent #06B6D4
WHITE = (255, 255, 255)
INK = (15, 23, 42)            # #0F172A

SIZE = 2048
CENTER = SIZE // 2


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def gradient_bg(size):
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        color = lerp(BLUE_TOP, BLUE_BOTTOM, y / size)
        for x in range(size):
            px[x, y] = color
    return img


def rounded_mask(size, radius):
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return mask


def rays(draw, cx, cy, radius, alpha=30):
    """Light fanning upward and sideways behind the cross, like light
    rising. The bottom stays calm so the mark reads clean at small sizes."""
    import math

    for angle in range(-170, -9, 12):
        half = 4.0
        a1 = math.radians(angle - half)
        a2 = math.radians(angle + half)
        points = [
            (cx, cy),
            (cx + radius * math.cos(a1), cy + radius * math.sin(a1)),
            (cx + radius * math.cos(a2), cy + radius * math.sin(a2)),
        ]
        draw.polygon(points, fill=(255, 255, 255, alpha))


def glow_circle(draw, cx, cy, radius, alpha=16):
    """Soft halo behind the cross centre, brightest at the centre and
    fading to invisible at the edge (no visible ring)."""
    for step in range(24, 0, -1):
        a = int(alpha * ((25 - step) / 24) ** 2)
        r = radius * step // 24
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 255, 255, a))


def cross(draw, cx, bar_y, color):
    """A proper cross: the horizontal bar sits above the middle, so the
    top arm is shorter than the bottom arm. Rounded ends."""
    v_w, v_top, v_bottom = 220, 500, 1580
    h_h, h_left, h_right = 220, 600, 1448
    r = 60
    draw.rounded_rectangle(
        [cx - v_w // 2, v_top, cx + v_w // 2, v_bottom], radius=r, fill=color
    )
    draw.rounded_rectangle(
        [h_left, bar_y - h_h // 2, h_right, bar_y + h_h // 2], radius=r, fill=color
    )


def cyan_glow(img, size):
    """Soft cyan glow in the bottom-right corner, brightest at its
    centre and fading to invisible at the edge (no visible ring)."""
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)
    gx, gy, gr = int(size * 0.85), int(size * 0.88), int(size * 0.55)
    for step in range(40, 0, -1):
        alpha = int(34 * ((41 - step) / 40) ** 2)
        r = gr * step // 40
        draw.ellipse(
            [gx - r, gy - r, gx + r, gy + r],
            fill=(CYAN[0], CYAN[1], CYAN[2], alpha),
        )
    img.alpha_composite(glow)


def build_icon():
    img = gradient_bg(SIZE).convert("RGBA")
    overlay = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    glow_circle(ImageDraw.Draw(overlay), CENTER, 1000, 900)
    rays(ImageDraw.Draw(overlay), CENTER, 1000, 1400)
    img.alpha_composite(overlay)
    cyan_glow(img, SIZE)
    draw = ImageDraw.Draw(img)
    cross(draw, CENTER, 860, WHITE)
    img.putalpha(rounded_mask(SIZE, 460))
    return img


def build_mark():
    """Cross + rays on transparent, for dark backgrounds."""
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    glow_circle(ImageDraw.Draw(img), CENTER, 1000, 900, alpha=22)
    rays(ImageDraw.Draw(img), CENTER, 1000, 1400, alpha=44)
    draw = ImageDraw.Draw(img)
    cross(draw, CENTER, 860, WHITE)
    return img


def build_lockup(icon_path, text_color, out_path):
    icon = Image.open(icon_path).resize((512, 512), Image.LANCZOS)
    font = ImageFont.truetype(
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 210
    )
    tmp = Image.new("RGBA", (10, 10))
    text_w = ImageDraw.Draw(tmp).textlength("True Worship", font=font)
    width = 512 + 80 + int(text_w) + 40
    canvas = Image.new("RGBA", (width, 640), (0, 0, 0, 0))
    canvas.alpha_composite(icon, (0, 64))
    draw = ImageDraw.Draw(canvas)
    draw.text((512 + 80, 200), "True Worship", font=font, fill=text_color)
    canvas.save(out_path)
    print("wrote", out_path, canvas.size)


def main():
    import os

    os.makedirs(OUT, exist_ok=True)
    icon = build_icon()
    for name, size in [
        ("true-worship-icon-1024.png", 1024),
        ("true-worship-icon-512.png", 512),
        ("true-worship-icon-192.png", 192),
    ]:
        icon.resize((size, size), Image.LANCZOS).save(f"{OUT}/{name}")
        print("wrote", f"{OUT}/{name}")
    mark = build_mark()
    mark.save(f"{OUT}/true-worship-mark-transparent.png")
    print("wrote", f"{OUT}/true-worship-mark-transparent.png")
    build_lockup(
        f"{OUT}/true-worship-icon-512.png", INK + (255,),
        f"{OUT}/logo-horizontal-dark.png",
    )
    build_lockup(
        f"{OUT}/true-worship-icon-512.png", WHITE + (255,),
        f"{OUT}/logo-horizontal-light.png",
    )


if __name__ == "__main__":
    main()
