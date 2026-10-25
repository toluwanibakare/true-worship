"""Generate True Worship's pre-installed backgrounds.

Everything here is drawn from scratch by this script (gradients, noise,
silhouettes, light), so every file is original work with no third-party
licence attached. Run it from the repo root:

    python3 assets/backgrounds/generate.py            # everything
    python3 assets/backgrounds/generate.py stills     # photos/stills only
    python3 assets/backgrounds/generate.py motion     # videos only

Outputs go to public/backgrounds/ (served automatically by Vite):

  <name>.jpg   1920x1080 stills; each motion loop also gets a .jpg poster
  <name>.webm  1280x720 VP9 loops, built to be seamless: every motion
               is periodic over the loop length, so the last frame flows
               back into the first with no jump. WebM plays natively in
               Electron and every browser, and needs no H.264 encoder.

Needs Pillow, NumPy and ffmpeg on PATH. The generated files are not
committed; run this once after a fresh clone (npm run backgrounds).
"""

import math
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "public", "backgrounds")
STILL = (1920, 1080)
VIDEO = (1280, 720)
FPS = 24


# --- small toolkit -----------------------------------------------------


def to_image(array):
    return Image.fromarray((np.clip(array, 0, 1) * 255 + 0.5).astype(np.uint8))


def from_image(image):
    return np.asarray(image.convert("RGB"), dtype=np.float32) / 255.0


def rgb(r, g, b):
    return np.array([r, g, b], dtype=np.float32) / 255.0


def vertical_gradient(w, h, stops):
    """stops: [(position 0..1, (r, g, b))] top to bottom."""
    y = np.linspace(0, 1, h)
    positions = [p for p, _ in stops]
    colours = np.array([c for _, c in stops], dtype=np.float32) / 255.0
    column = np.stack([np.interp(y, positions, colours[:, i]) for i in range(3)], -1)
    return np.repeat(column[:, None, :], w, axis=1).astype(np.float32)


def radial(w, h, cx, cy, rx, ry, power=2.0):
    """A soft blob: 1 at the centre, 0 at the edge."""
    x = (np.arange(w)[None, :] - cx) / rx
    y = (np.arange(h)[:, None] - cy) / ry
    return np.clip(1 - np.sqrt(x * x + y * y), 0, 1) ** power


def periodic_noise(w, h, gw, gh, seed):
    """Smooth noise that tiles exactly across x, so np.roll loops it."""
    rng = np.random.default_rng(seed)
    grid = rng.random((gh, gw)).astype(np.float32)
    tiled = Image.fromarray(np.tile(grid, (1, 3)))
    wide = tiled.resize((3 * w, h), Image.BICUBIC)
    return np.asarray(wide)[:, w : 2 * w]


def fbm(w, h, gw, gh, octaves, seed, persistence=0.5):
    total = np.zeros((h, w), dtype=np.float32)
    amplitude, norm = 1.0, 0.0
    for octave in range(octaves):
        total += amplitude * periodic_noise(w, h, gw * 2**octave, gh * 2**octave, seed + octave)
        norm += amplitude
        amplitude *= persistence
    return total / norm


def smooth(edge0, edge1, x):
    t = np.clip((x - edge0) / (edge1 - edge0), 0, 1)
    return t * t * (3 - 2 * t)


def line_noise(width, points, seed):
    """1D smooth noise for mountain ridges."""
    rng = np.random.default_rng(seed)
    values = rng.random(points + 2)
    x = np.linspace(0, points, width)
    i = np.floor(x).astype(int)
    f = x - i
    f = f * f * (3 - 2 * f)
    return values[i] * (1 - f) + values[i + 1] * f


def ridge(width, base, amplitude, seed, octaves=5):
    total = np.zeros(width)
    scale, norm = 1.0, 0.0
    for octave in range(octaves):
        total += scale * line_noise(width, 3 * 2**octave, seed + octave)
        norm += scale
        scale *= 0.5
    return base + amplitude * (total / norm - 0.5) * 2


def add_grain(array, seed, amount=0.012):
    rng = np.random.default_rng(seed)
    grain = rng.normal(0, amount, array.shape[:2]).astype(np.float32)
    return array + grain[..., None]


def vignette(array, strength=0.35):
    h, w = array.shape[:2]
    shade = 1 - strength * (1 - radial(w, h, w / 2, h / 2, w * 0.75, h * 0.8, 1.2))
    return array * shade[..., None]


def save_still(name, array):
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name + ".jpg")
    to_image(add_grain(array, hash(name) % 1000)).save(path, quality=88, optimize=True)
    print("wrote", path)


# --- stills ------------------------------------------------------------


def mountain_layers(w, h, layers, sky_horizon, seed):
    """Atmospheric mountain ranges: far ones pale and hazy, near ones dark."""
    out = None
    yy = np.arange(h)[:, None]
    for index, (base, amp, colour, haze) in enumerate(layers):
        edge = ridge(w, base * h, amp * h, seed + index * 17)
        mask = np.clip((yy - edge[None, :]) / 2.0 + 0.5, 0, 1)
        shade = np.array(colour, dtype=np.float32) / 255.0
        # Haze pulls the colour toward the horizon glow; lower = nearer.
        shade = shade * (1 - haze) + sky_horizon * haze
        # Darken toward the foot so ranges merge into mist, not a hard base.
        layer = np.broadcast_to(shade, (h, w, 3)).copy()
        out = (layer, mask) if out is None else (layer, mask)
        yield layer, mask


def still_sunrise_peaks():
    w, h = STILL
    sky = vertical_gradient(w, h, [(0, (18, 24, 64)), (0.45, (92, 66, 124)), (0.7, (236, 124, 84)), (0.82, (255, 196, 120)), (1, (255, 214, 150))])
    sun = radial(w, h, w * 0.5, h * 0.74, w * 0.55, h * 0.5, 2.2)
    sky = sky + rgb(255, 190, 110) * sun[..., None] * 0.65
    clouds = fbm(w, h, 3, 2, 5, 11)
    band = smooth(0.2, 0.9, 1 - np.abs(np.linspace(0, 1, h)[:, None] - 0.5) * 2) * 0.5
    sky = sky + (rgb(255, 170, 120) * (smooth(0.5, 0.8, clouds) * band)[..., None]) * 0.5
    horizon = rgb(255, 190, 130)
    layers = [(0.66, 0.07, (96, 78, 128), 0.55), (0.74, 0.08, (66, 54, 104), 0.38), (0.84, 0.09, (38, 32, 74), 0.2), (0.95, 0.07, (14, 14, 32), 0.05)]
    for layer, mask in mountain_layers(w, h, layers, horizon, 5):
        sky = sky * (1 - mask[..., None]) + layer * mask[..., None]
    return vignette(sky, 0.28)


def still_ocean_dusk():
    w, h = STILL
    horizon_y = int(h * 0.56)
    sky = vertical_gradient(w, h, [(0, (34, 24, 72)), (0.3, (122, 62, 118)), (0.5, (246, 126, 96)), (0.56, (255, 196, 128)), (1, (255, 196, 128))])
    clouds = fbm(w, h, 4, 3, 5, 31)
    sky = sky + rgb(255, 150, 130) * (smooth(0.45, 0.85, clouds) * (1 - np.linspace(0, 1, h)[:, None]) * 0.5)[..., None] * 0.7
    sun = radial(w, h, w * 0.5, horizon_y, w * 0.4, h * 0.3, 2.0)
    sky = sky + rgb(255, 200, 140) * sun[..., None] * 0.6
    # Sea: dark, with horizontal ripples and a broken sun reflection.
    yy = np.arange(h)[:, None]
    depth = np.clip((yy - horizon_y) / (h - horizon_y), 0, 1)
    sea = vertical_gradient(w, h, [(0, (10, 14, 40)), (0.56, (88, 56, 96)), (1, (8, 10, 28))])
    ripples = fbm(w, h, 2, 90, 4, 47)
    sea = sea * (0.75 + 0.5 * ripples[..., None])
    column = np.exp(-(((np.arange(w)[None, :] - w * 0.5) / (w * 0.03 * (0.4 + depth * 2.2))) ** 2))
    glints = smooth(0.52, 0.8, ripples) * column * (1 - depth * 0.6)
    sea = sea + rgb(255, 190, 130) * glints[..., None] * 1.1
    mask = np.clip((yy - horizon_y) / 2.0, 0, 1)
    image = sky * (1 - mask[..., None]) + sea * mask[..., None]
    return vignette(image, 0.3)


def still_clouds_light():
    w, h = STILL
    sky = vertical_gradient(w, h, [(0, (22, 74, 160)), (0.55, (84, 150, 220)), (1, (190, 224, 246))])
    sun_x, sun_y = w * 0.78, h * 0.14
    glow = radial(w, h, sun_x, sun_y, w * 0.55, h * 0.9, 1.6)
    sky = sky + rgb(255, 244, 214) * glow[..., None] * 0.55
    density = fbm(w, h, 3, 2, 6, 71)
    puffs = smooth(0.4, 0.68, density * (0.7 + 0.55 * np.linspace(0, 1, h)[:, None]))
    # Lit from the sun side: brighter where the cloud faces it.
    lit = np.clip(1 - np.hypot(np.arange(w)[None, :] - sun_x, np.arange(h)[:, None] - sun_y) / (w * 0.9), 0, 1)
    cloud_colour = rgb(206, 218, 236)[None, None, :] * (1 - lit[..., None]) + rgb(255, 252, 244)[None, None, :] * lit[..., None]
    image = sky * (1 - puffs[..., None]) + cloud_colour * puffs[..., None]
    image = image + rgb(255, 240, 200) * (radial(w, h, sun_x, sun_y, w * 0.22, h * 0.4, 2.2))[..., None] * 0.5
    return vignette(image, 0.18)


def still_night_stars():
    w, h = STILL
    sky = vertical_gradient(w, h, [(0, (4, 6, 22)), (0.6, (14, 22, 60)), (1, (30, 40, 90))])
    # A soft milky band running corner to corner.
    xs, ys = np.meshgrid(np.linspace(0, 1, w), np.linspace(0, 1, h))
    band = np.exp(-(((ys - 0.3 - 0.45 * xs) / 0.12) ** 2))
    mist = fbm(w, h, 3, 2, 5, 91)
    sky = sky + rgb(120, 130, 200) * (band * smooth(0.35, 0.8, mist) * 0.55)[..., None]
    rng = np.random.default_rng(3)
    stars = np.zeros((h, w), dtype=np.float32)
    for _ in range(1400):
        x, y = rng.integers(0, w), rng.integers(0, h)
        stars[y, x] = rng.random() ** 3 * (1.0 if band[y, x] < 0.1 else 1.4)
    glow = np.asarray(Image.fromarray((np.clip(stars, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.4)), dtype=np.float32) / 255.0
    sky = sky + (np.clip(stars, 0, 1) + glow * 5)[..., None] * rgb(235, 240, 255)
    for x, y in [(430, 210), (1480, 150), (1130, 360), (260, 520)]:
        sky = sky + radial(w, h, x, y, 38, 38, 2.5)[..., None] * rgb(220, 230, 255) * 0.8
    edge = ridge(w, 0.9 * h, 0.05 * h, 12, 4)
    mask = np.clip((np.arange(h)[:, None] - edge[None, :]) / 2.0 + 0.5, 0, 1)
    sky = sky * (1 - mask[..., None]) + rgb(3, 5, 14) * mask[..., None]
    return vignette(sky, 0.3)


def still_calvary_sunset():
    w, h = STILL
    sky = vertical_gradient(w, h, [(0, (40, 22, 70)), (0.35, (150, 54, 96)), (0.62, (252, 120, 70)), (0.8, (255, 188, 96)), (1, (255, 214, 130))])
    sun = radial(w, h, w * 0.7, h * 0.78, w * 0.4, h * 0.45, 2.0)
    sky = sky + rgb(255, 200, 120) * sun[..., None] * 0.7
    clouds = fbm(w, h, 4, 3, 5, 5)
    sky = sky + rgb(255, 120, 90) * (smooth(0.5, 0.85, clouds) * (1 - np.linspace(0, 1, h)[:, None]) * 0.6)[..., None] * 0.6
    image = to_image(sky)
    # A rolling hill with a cross on it, to the right so words stay clear.
    edge = ridge(w, 0.82 * h, 0.07 * h, 21, 3)
    edge = edge - 0.1 * h * np.exp(-(((np.arange(w) - w * 0.74) / (w * 0.2)) ** 2))
    mask = np.clip((np.arange(h)[:, None] - edge[None, :]) / 1.5 + 0.5, 0, 1)
    silhouette = rgb(12, 8, 18)
    arr = from_image(image) * (1 - mask[..., None]) + silhouette * mask[..., None]
    out = to_image(arr)
    draw = ImageDraw.Draw(out)
    cx = int(w * 0.74)
    top = int(edge[cx]) - 330
    draw.rectangle([cx - 11, top, cx + 11, top + 345], fill=(12, 8, 18))
    draw.rectangle([cx - 78, top + 80, cx + 78, top + 102], fill=(12, 8, 18))
    return vignette(from_image(out), 0.3)


def still_golden_bokeh():
    w, h = STILL
    base = vertical_gradient(w, h, [(0, (24, 12, 6)), (0.6, (62, 28, 10)), (1, (110, 56, 14))])
    rng = np.random.default_rng(8)
    layer = Image.new("RGB", (w, h), (0, 0, 0))
    draw = ImageDraw.Draw(layer, "RGBA")
    for _ in range(70):
        r = int(rng.choice([26, 44, 70, 110]) * (0.7 + rng.random() * 0.6))
        x, y = int(rng.integers(0, w)), int(rng.integers(0, h))
        tint = [(255, 196, 96), (255, 160, 60), (255, 224, 150)][int(rng.integers(0, 3))]
        draw.ellipse([x - r, y - r, x + r, y + r], fill=tint + (int(14 + rng.random() * 34),))
        draw.ellipse([x - r, y - r, x + r, y + r], outline=tint + (46,), width=2)
    soft = layer.filter(ImageFilter.GaussianBlur(5))
    arr = base + from_image(soft) * 1.25
    return vignette(arr, 0.35)


def still_violet_waves():
    w, h = STILL
    xs, ys = np.meshgrid(np.linspace(0, 1, w), np.linspace(0, 1, h))
    image = vertical_gradient(w, h, [(0, (20, 10, 54)), (1, (70, 24, 110))])
    for index, (colour, phase, amp, freq, centre) in enumerate([
        (rgb(86, 56, 190), 0.0, 0.08, 1.4, 0.55),
        (rgb(150, 70, 200), 1.7, 0.07, 1.9, 0.68),
        (rgb(230, 110, 170), 3.1, 0.06, 2.4, 0.8),
    ]):
        curve = centre + amp * np.sin(2 * math.pi * freq * xs + phase) + 0.03 * np.sin(2 * math.pi * 3.7 * xs + phase * 2)
        band = smooth(0.0, 0.5, np.clip((ys - curve) / 0.28, 0, 1)) * (1 - smooth(0.6, 1.0, (ys - curve) / 0.5))
        image = image * (1 - 0.6 * band[..., None]) + colour * (0.6 * band[..., None])
    image = image + rgb(180, 120, 255) * (radial(w, h, w * 0.2, h * 0.1, w * 0.5, h * 0.7, 2))[..., None] * 0.35
    return vignette(image, 0.25)


def still_forest_mist():
    w, h = STILL
    sky = vertical_gradient(w, h, [(0, (22, 54, 62)), (0.5, (90, 140, 138)), (1, (196, 220, 206))])
    sky = sky + rgb(255, 250, 220) * radial(w, h, w * 0.3, h * 0.28, w * 0.5, h * 0.7, 2)[..., None] * 0.35
    image = to_image(sky)
    rng = np.random.default_rng(14)
    for layer, (base, size, colour, fog) in enumerate([(0.62, 90, (74, 118, 112), 0.55), (0.74, 140, (44, 84, 82), 0.38), (0.88, 210, (18, 46, 48), 0.2)]):
        trees = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(trees)
        x = -40
        while x < w + 60:
            tree_h = size * (0.7 + rng.random() * 0.8)
            tree_w = tree_h * 0.34
            top = base * h - tree_h
            draw.polygon([(x, base * h + 40), (x - tree_w, base * h + 40), (x, top)], fill=colour + (255,))
            draw.polygon([(x, base * h + 40), (x + tree_w, base * h + 40), (x, top)], fill=colour + (255,))
            x += tree_w * (0.9 + rng.random() * 0.7)
        draw.rectangle([0, base * h + 30, w, h], fill=colour + (255,))
        image.paste(trees, (0, 0), trees)
        mist = vertical_gradient(w, h, [(max(base - 0.12, 0), (200, 224, 214)), (base + 0.1, (200, 224, 214))])
        band = np.exp(-(((np.linspace(0, 1, h)[:, None] - (base - 0.02)) / 0.07) ** 2)) * fog
        image = to_image(from_image(image) * (1 - band[..., None]) + mist * band[..., None])
    return vignette(from_image(image), 0.3)


STILLS = {
    "sunrise-peaks": still_sunrise_peaks,
    "ocean-dusk": still_ocean_dusk,
    "clouds-light": still_clouds_light,
    "night-stars": still_night_stars,
    "calvary-sunset": still_calvary_sunset,
    "golden-bokeh": still_golden_bokeh,
    "violet-waves": still_violet_waves,
    "forest-mist": still_forest_mist,
}


# --- motion ------------------------------------------------------------


def render_video(name, make_frame, count, poster_frame=0):
    """Pipe raw frames into ffmpeg; also save one frame as the poster."""
    os.makedirs(OUT, exist_ok=True)
    w, h = VIDEO
    target = os.path.join(OUT, name + ".webm")
    process = subprocess.Popen(
        [
            "ffmpeg", "-y", "-v", "error",
            "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}", "-r", str(FPS), "-i", "-",
            "-c:v", "libvpx-vp9", "-pix_fmt", "yuv420p", "-b:v", "0", "-crf", "36",
            "-row-mt", "1", "-deadline", "good", "-cpu-used", "5", target,
        ],
        stdin=subprocess.PIPE,
    )
    for frame in range(count):
        array = np.clip(make_frame(frame / count), 0, 1)
        if frame == poster_frame:
            to_image(array).resize(STILL, Image.LANCZOS).save(
                os.path.join(OUT, name + ".jpg"), quality=86, optimize=True
            )
        process.stdin.write((array * 255 + 0.5).astype(np.uint8).tobytes())
    process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError("ffmpeg failed for " + name)
    print("wrote", target)


def motion_clouds_drift():
    w, h = VIDEO
    sky = vertical_gradient(w, h, [(0, (26, 78, 164)), (0.6, (96, 160, 226)), (1, (206, 232, 250))])
    near = fbm(w, h, 3, 2, 5, 201)
    far = fbm(w, h, 4, 3, 5, 301)
    height = np.linspace(0, 1, h)[:, None]
    glow = radial(w, h, w * 0.8, h * 0.12, w * 0.5, h * 0.8, 1.6)

    def frame(t):
        # One full period of the noise over the loop: seamless.
        a = np.roll(far, int(w * t), axis=1)
        b = np.roll(near, int(w * 2 * t) % w, axis=1)
        mix = 0.55 * a + 0.45 * b
        puffs = smooth(0.5, 0.78, mix * (0.55 + 0.6 * height))
        cloud = rgb(214, 224, 240) * (1 - glow[..., None] * 0.6) + rgb(255, 252, 244) * glow[..., None] * 0.6
        image = sky + rgb(255, 244, 214) * glow[..., None] * 0.5
        return image * (1 - puffs[..., None]) + cloud * puffs[..., None]

    return frame


def motion_aurora_flow():
    w, h = VIDEO
    base = vertical_gradient(w, h, [(0, (4, 8, 26)), (0.7, (8, 18, 44)), (1, (4, 8, 20))])
    xs = np.linspace(0, 1, w)[None, :]
    ys = np.linspace(0, 1, h)[:, None]
    rng = np.random.default_rng(6)
    stars = np.zeros((h, w), dtype=np.float32)
    star_points = [(int(rng.integers(0, w)), int(rng.integers(0, h * 3 // 4)), rng.random() * 6.28) for _ in range(260)]
    for x, y, _ in star_points:
        stars[y, x] = 0.25 + rng.random() * 0.6

    def frame(t):
        angle = 2 * math.pi * t
        image = base.copy()
        for colour, freq, phase, centre, spread in [
            (rgb(40, 230, 150), 1.0, 0.0, 0.34, 0.11),
            (rgb(60, 180, 230), 2.0, 1.3, 0.42, 0.09),
            (rgb(150, 90, 230), 3.0, 2.6, 0.30, 0.07),
        ]:
            wave = centre + 0.09 * np.sin(2 * math.pi * freq * xs + phase + angle) + 0.04 * np.sin(2 * math.pi * (freq + 1) * xs - phase + 2 * angle)
            band = np.exp(-(((ys - wave) / spread) ** 2))
            shimmer = 0.75 + 0.25 * np.sin(2 * math.pi * (freq * 4) * xs + 3 * angle + phase)
            image = image + colour * (band * shimmer * 0.7)[..., None]
        twinkle = 0.6 + 0.4 * np.sin(angle * 2 + stars * 40)
        image = image + (stars * twinkle)[..., None] * rgb(230, 238, 255)
        return image

    return frame


def motion_bokeh_rise():
    w, h = VIDEO
    base = vertical_gradient(w, h, [(0, (16, 10, 40)), (0.6, (44, 20, 80)), (1, (90, 40, 110))])
    rng = np.random.default_rng(12)
    sprites = {}
    for r in (14, 22, 34, 52):
        size = r * 2 + 6
        disc = Image.new("L", (size, size), 0)
        d = ImageDraw.Draw(disc)
        d.ellipse([3, 3, size - 4, size - 4], fill=70)
        d.ellipse([3, 3, size - 4, size - 4], outline=120, width=2)
        sprites[r] = np.asarray(disc.filter(ImageFilter.GaussianBlur(1.6)), dtype=np.float32) / 255.0
    discs = []
    for index in range(36):
        r = int(rng.choice(list(sprites)))
        tint = [rgb(255, 170, 230), rgb(170, 160, 255), rgb(255, 210, 160), rgb(150, 220, 255)][index % 4]
        laps = 1 + (index % 2)  # whole laps per loop keeps it seamless
        discs.append((int(rng.integers(0, w)), rng.random(), r, tint, laps, rng.random() * 0.6 + 0.4))

    def frame(t):
        image = base.copy()
        span = h + 120
        for x, y0, r, tint, laps, alpha in discs:
            y = (y0 - laps * t) % 1.0 * span - 60
            sprite = sprites[r]
            size = sprite.shape[0]
            top = int(h - y - size / 2)
            left = x - size // 2
            sy0, sy1 = max(top, 0), min(top + size, h)
            sx0, sx1 = max(left, 0), min(left + size, w)
            if sy0 >= sy1 or sx0 >= sx1:
                continue
            patch = sprite[sy0 - top : sy1 - top, sx0 - left : sx1 - left]
            image[sy0:sy1, sx0:sx1] += patch[..., None] * tint * alpha
        return image

    return frame


def motion_light_shafts():
    w, h = VIDEO
    base = vertical_gradient(w, h, [(0, (10, 20, 54)), (0.7, (14, 30, 76)), (1, (6, 14, 40))])
    xs, ys = np.meshgrid(np.linspace(0, 1, w), np.linspace(0, 1, h))
    rng = np.random.default_rng(22)
    motes = [(rng.random(), rng.random(), 1 + int(rng.integers(0, 3)), 0.25 + rng.random() * 0.6) for _ in range(120)]

    def frame(t):
        angle = 2 * math.pi * t
        image = base.copy()
        skew = xs + 0.55 * ys
        for freq, phase, strength in [(5, 0.0, 0.16), (9, 1.4, 0.11), (14, 2.9, 0.08)]:
            shaft = np.clip(np.sin(2 * math.pi * freq * skew + phase + angle), 0, 1) ** 3
            fade = np.clip(1 - ys * 1.1, 0, 1) * np.exp(-(((xs - 0.35 - 0.1 * math.sin(angle)) / 0.9) ** 2))
            image = image + rgb(150, 190, 255) * (shaft * fade * strength)[..., None]
        image = image + rgb(120, 170, 255) * radial(w, h, w * 0.3, -h * 0.1, w * 0.6, h * 0.9, 1.8)[..., None] * 0.35
        dust = np.zeros((h, w), dtype=np.float32)
        for x, y0, laps, bright in motes:
            y = int(((y0 - laps * t) % 1.0) * h)
            px = int((x + 0.015 * math.sin(angle * laps + x * 20)) % 1.0 * w)
            dust[y, px] = bright
        dust = np.asarray(Image.fromarray((dust * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.1)), dtype=np.float32) / 255.0
        return image + (dust * 4)[..., None] * rgb(200, 220, 255)

    return frame


def motion_violet_waves():
    w, h = VIDEO
    xs, ys = np.meshgrid(np.linspace(0, 1, w), np.linspace(0, 1, h))
    base = vertical_gradient(w, h, [(0, (20, 10, 54)), (1, (70, 24, 110))])

    def frame(t):
        angle = 2 * math.pi * t
        image = base.copy()
        for colour, freq, phase, amp, centre, speed in [
            (rgb(86, 56, 190), 1.0, 0.0, 0.08, 0.55, 1),
            (rgb(150, 70, 200), 2.0, 1.7, 0.07, 0.68, -1),
            (rgb(230, 110, 170), 3.0, 3.1, 0.06, 0.8, 2),
        ]:
            curve = centre + amp * np.sin(2 * math.pi * freq * xs + phase + speed * angle) + 0.03 * np.sin(2 * math.pi * (freq + 2) * xs + phase * 2 - speed * angle)
            band = smooth(0.0, 0.5, np.clip((ys - curve) / 0.28, 0, 1)) * (1 - smooth(0.6, 1.0, (ys - curve) / 0.5))
            image = image * (1 - 0.6 * band[..., None]) + colour * (0.6 * band[..., None])
        return image + rgb(180, 120, 255) * radial(w, h, w * 0.2, h * 0.1, w * 0.5, h * 0.7, 2)[..., None] * 0.3

    return frame


def motion_starfield_twinkle():
    w, h = VIDEO
    base = vertical_gradient(w, h, [(0, (4, 6, 22)), (0.65, (12, 20, 56)), (1, (28, 38, 88))])
    rng = np.random.default_rng(33)
    layers = []
    for count, speed, size in [(220, 1, 1.0), (110, 2, 1.5), (40, 3, 2.2)]:
        pts = [(rng.random(), rng.random(), rng.random() * 6.28, 0.3 + rng.random() * 0.7) for _ in range(count)]
        layers.append((pts, speed, size))

    def frame(t):
        angle = 2 * math.pi * t
        canvas = np.zeros((h, w), dtype=np.float32)
        for pts, speed, size in layers:
            for x, y, phase, bright in pts:
                px = int(((x + speed * 0.02 * t * 10 // 10) % 1.0) * w)
                py = int(y * h)
                canvas[py, px] = max(canvas[py, px], bright * (0.55 + 0.45 * math.sin(angle * speed + phase)))
        soft = np.asarray(Image.fromarray((np.clip(canvas, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)), dtype=np.float32) / 255.0
        return base + (canvas + soft * 4)[..., None] * rgb(232, 238, 255)

    return frame


# Rays, golden zoom and embers are the original three loops, kept as they
# were so existing presets keep working.
def _rays(draw, cx, cy, radius, count, rotation, alpha):
    for i in range(count):
        angle = rotation + (360 / count) * i
        a1, a2 = math.radians(angle - 4.0), math.radians(angle + 4.0)
        draw.polygon(
            [(cx, cy), (cx + radius * math.cos(a1), cy + radius * math.sin(a1)), (cx + radius * math.cos(a2), cy + radius * math.sin(a2))],
            fill=(255, 255, 255, alpha),
        )


def motion_rays_drift():
    w, h = VIDEO
    base = to_image(vertical_gradient(w, h, [(0, (30, 64, 175)), (1, (30, 58, 138))])).convert("RGBA")

    def frame(t):
        image = base.copy()
        overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        _rays(ImageDraw.Draw(overlay), w // 2, int(h * 0.42), int(w * 1.05), 24, 15 * t, 26)
        image.alpha_composite(overlay)
        arr = from_image(image)
        return arr + rgb(6, 182, 212) * radial(w, h, w * 0.85, h * 0.88, w * 0.4, w * 0.4, 2)[..., None] * 0.2

    return frame


def motion_ember_rise():
    w, h = VIDEO
    base = vertical_gradient(w, h, [(0, (28, 10, 10)), (1, (10, 5, 5))])
    base = base + rgb(220, 38, 38) * radial(w, h, w / 2, h, w * 0.45, w * 0.45, 2)[..., None] * 0.4

    def frame(t):
        overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)
        span = h + 40
        for i in range(70):
            x = (i * 173) % w
            laps = 1 if i % 3 else 2
            y = ((i * 269) % span - span * laps * t) % span - 20
            r = 3 + (i % 5)
            colour = [(245, 158, 11), (249, 115, 22), (220, 38, 38)][i % 3]
            for ring in range(3, 0, -1):
                alpha = int(120 * (ring / 3) ** 2)
                draw.ellipse([x - r * ring, y - r * ring, x + r * ring, y + r * ring], fill=colour + (alpha,))
        arr = to_image(base).convert("RGBA")
        arr.alpha_composite(overlay)
        return from_image(arr)

    return frame


def motion_golden_zoom():
    w, h = VIDEO
    still = to_image(
        vertical_gradient(w, h, [(0, (124, 45, 18)), (1, (28, 10, 0))])
        + rgb(245, 158, 11) * radial(w, h, w / 2, h, w * 0.55, w * 0.55, 2)[..., None] * 0.6
    )

    def frame(t):
        # Zoom in then back out, so the loop closes smoothly.
        zoom = 1 + 0.12 * (0.5 - 0.5 * math.cos(2 * math.pi * t))
        cw, ch = w / zoom, h / zoom
        box = ((w - cw) / 2, (h - ch) / 2, (w + cw) / 2, (h + ch) / 2)
        return from_image(still.resize((w, h), Image.BICUBIC, box=box))

    return frame


MOTION = {
    "clouds-drift": (motion_clouds_drift, 360),
    "aurora-flow": (motion_aurora_flow, 288),
    "bokeh-rise": (motion_bokeh_rise, 288),
    "light-shafts": (motion_light_shafts, 288),
    "violet-flow": (motion_violet_waves, 288),
    "starfield": (motion_starfield_twinkle, 240),
    "rays-drift": (motion_rays_drift, 240),
    "golden-zoom": (motion_golden_zoom, 360),
    "ember-rise": (motion_ember_rise, 240),
}


def main(argv):
    which = argv[1] if len(argv) > 1 else "all"
    names = argv[2:]
    if which in ("all", "stills"):
        for name, make in STILLS.items():
            if not names or name in names:
                save_still(name, make())
    if which in ("all", "motion"):
        for name, (build, count) in MOTION.items():
            if not names or name in names:
                render_video(name, build(), count)


if __name__ == "__main__":
    sys.exit(main(sys.argv))
