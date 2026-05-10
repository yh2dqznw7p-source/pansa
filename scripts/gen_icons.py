#!/usr/bin/env python3
"""Generate Tauri bundle icons from a procedural design.

Produces: 32x32.png, 128x128.png, 128x128@2x.png, icon.ico, icon.icns (stub).
The design is a gradient "O" disc to avoid any third-party assets.
"""

from PIL import Image, ImageDraw, ImageFilter
import os, struct

OUT = os.path.join(os.path.dirname(__file__), "..", "src-tauri", "icons")
os.makedirs(OUT, exist_ok=True)

def make_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # gradient background disc
    grad = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for i in range(size):
        t = i / max(size - 1, 1)
        r = int(91 * (1 - t) + 139 * t)
        g = int(124 * (1 - t) + 91 * t)
        b = int(250 * (1 - t) + 250 * t)
        gd.line([(0, i), (size, i)], fill=(r, g, b, 255))
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size, size), fill=255)
    img.paste(grad, (0, 0), mask)

    # inner white "O" ring
    pad = max(size // 6, 2)
    d.ellipse((pad, pad, size - pad, size - pad), outline=(255, 255, 255, 230), width=max(size // 16, 2))

    # soft highlight
    hl = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    hd = ImageDraw.Draw(hl)
    hd.ellipse((size * 0.1, size * 0.05, size * 0.6, size * 0.5), fill=(255, 255, 255, 90))
    hl = hl.filter(ImageFilter.GaussianBlur(size / 14))
    img.alpha_composite(hl)
    return img

sizes = {
    "32x32.png": 32,
    "128x128.png": 128,
    "128x128@2x.png": 256,
}
for name, s in sizes.items():
    make_icon(s).save(os.path.join(OUT, name), "PNG")
    print("wrote", name)

# ICO with multiple sizes
ico_sizes = [16, 24, 32, 48, 64, 128, 256]
ico_images = [make_icon(s) for s in ico_sizes]
ico_images[0].save(
    os.path.join(OUT, "icon.ico"),
    format="ICO",
    sizes=[(s, s) for s in ico_sizes],
    append_images=ico_images[1:],
)
print("wrote icon.ico")

# icns: Pillow's icns writer works on macOS only; write a PNG-bearing stub the bundler tolerates.
# On Windows build we don't need icns; keep a placeholder copy of the 256x256 PNG.
make_icon(256).save(os.path.join(OUT, "icon.icns"), "PNG")
print("wrote icon.icns (PNG stub — macOS builder will regenerate if needed)")
