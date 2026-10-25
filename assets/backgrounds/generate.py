"""Generate True Worship's pre-installed backgrounds.

Stills are drawn with Pillow; motion loops are rendered as frames and
encoded with ffmpeg. Run from the repo root:

    python3 assets/backgrounds/generate.py

Outputs go to public/backgrounds/ (served automatically by Vite):
  deep-rays.png, golden-hour.png, ember.png   stills, 1920x1080
  rays-drift.mp4   deep blue rays turning, seamless 8s loop
  golden-zoom.mp4  slow zoom over a warm gradient, 15s
  ember-rise.mp4   soft embers drifting upward, seamless 8s loop

The loops are seamless on purpose: rays-drift rotates exactly one ray
period over the loop, and every ember's rise speed divides the loop
length, so the last frame flows back into the first with no jump.

Video files are not committed (the GitHub connector used for this repo
only takes text files). This script is the source of truth; run it once
after a fresh clone.
"""

import math
import os
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "public", "backgrounds")
W, H = 1280, 720
FPS = 30


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def gradient(size, top, bottom):
    w, h = size
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        color = lerp(top, bottom, y / h)
        for x in range(w):
            px[x, y] = color
    return img.convert("RGBA")


def glow(img, cx, cy, radius, color, peak):
    """Soft glow, brightest at the centre, invisible at the edge."""
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for step in range(32, 0, -1):
        alpha = int(peak * ((33 - step) / 32) ** 2)
        r = radius * step // 32
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color + (alpha,))
    img.alpha_composite(overlay)


def rays(draw, cx, cy, radius, count, rotation, alpha):
    for i in range(count):
        angle = rotation + (360 / count) * i
        half = 4.0
        a1 = math.radians(angle - half)
        a2 = math.radians(angle + half)
        draw.polygon(
            [
                (cx, cy),
                (cx + radius * math.cos(a1), cy + radius * math.sin(a1)),
                (cx + radius * math.cos(a2), cy + radius * math.sin(a2)),
            ],
            fill=(255, 255, 255, alpha),
        )


def deep_rays_frame(size, rotation):
    w, h = size
    img = gradient(size, (30, 64, 175), (30, 58, 138))
    overlay = Image.new("RGBA", size, (0, 0, 0, 0))
    rays(ImageDraw.Draw(overlay), w // 2, int(h * 0.42), int(w * 1.05), 24, rotation, 26)
    img.alpha_composite(overlay)
    glow(img, int(w * 0.85), int(h * 0.88), int(w * 0.4), (6, 182, 212), 26)
    return img


def golden_frame(size):
    w, h = size
    img = gradient(size, (124, 45, 18), (28, 10, 0))
    glow(img, w // 2, h, int(w * 0.55), (245, 158, 11), 150)
    return img


def ember_frame(size, frame, total):
    w, h = size
    img = gradient(size, (28, 10, 10), (10, 5, 5))
    glow(img, w // 2, h, int(w * 0.45), (220, 38, 38), 110)
    overlay = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    span = h + 40
    for i in range(70):
        x = (i * 173) % w
        y0 = (i * 269) % span
        laps = 1 if i % 3 else 2
        speed = span * laps / total
        y = (y0 - speed * frame) % span - 20
        r = 3 + (i % 5)
        color = [(245, 158, 11), (249, 115, 22), (220, 38, 38)][i % 3]
        for ring in range(3, 0, -1):
            alpha = int(120 * (ring / 3) ** 2)
            draw.ellipse(
                [x - r * ring, y - r * ring, x + r * ring, y + r * ring],
                fill=color + (alpha,),
            )
    img.alpha_composite(overlay)
    return img


def encode(frames_dir, out_path, count):
    subprocess.run(
        [
            "ffmpeg", "-y", "-v", "error",
            "-framerate", str(FPS),
            "-i", os.path.join(frames_dir, "frame_%04d.png"),
            "-frames:v", str(count),
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20",
            "-movflags", "+faststart",
            out_path,
        ],
        check=True,
    )
    print("wrote", out_path)


def render_loop(name, make_frame, count):
    with tempfile.TemporaryDirectory() as tmp:
        for frame in range(count):
            make_frame(frame).save(os.path.join(tmp, f"frame_{frame:04d}.png"))
        encode(tmp, os.path.join(OUT, name), count)


def main():
    os.makedirs(OUT, exist_ok=True)
    # Stills, full HD, for use as backdrops and media.
    deep_rays_frame((1920, 1080), 0).convert("RGB").save(
        os.path.join(OUT, "deep-rays.png"))
    golden_frame((1920, 1080)).convert("RGB").save(
        os.path.join(OUT, "golden-hour.png"))
    ember_frame((1920, 1080), 0, 240).convert("RGB").save(
        os.path.join(OUT, "ember.png"))
    print("wrote stills to", OUT)
    # Motion loops.
    render_loop(
        "rays-drift.mp4",
        lambda frame: deep_rays_frame((W, H), 15 * frame / 240),
        240,
    )
    render_loop(
        "ember-rise.mp4",
        lambda frame: ember_frame((W, H), frame, 240),
        240,
    )
    # Golden zoom: one still, slow zoompan over 15 seconds.
    still = os.path.join(OUT, "golden-hour.png")
    subprocess.run(
        [
            "ffmpeg", "-y", "-v", "error",
            "-loop", "1", "-framerate", str(FPS), "-i", still,
            "-vf", "zoompan=z='min(zoom+0.0004,1.12)':d=450:s=1280x720:fps=30",
            "-frames:v", "450",
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20",
            "-movflags", "+faststart",
            os.path.join(OUT, "golden-zoom.mp4"),
        ],
        check=True,
    )
    print("wrote", os.path.join(OUT, "golden-zoom.mp4"))


if __name__ == "__main__":
    sys.exit(main())
