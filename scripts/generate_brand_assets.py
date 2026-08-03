from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SOURCE = ASSETS / "branding" / "janani-mark.png"


def contain(image: Image.Image, size: int) -> Image.Image:
    result = image.copy()
    result.thumbnail((size, size), Image.Resampling.LANCZOS)
    return result


def centered(canvas: Image.Image, image: Image.Image) -> None:
    canvas.alpha_composite(
        image,
        ((canvas.width - image.width) // 2, (canvas.height - image.height) // 2),
    )


def white_silhouette(image: Image.Image) -> Image.Image:
    result = Image.new("RGBA", image.size, (255, 255, 255, 255))
    result.putalpha(image.getchannel("A"))
    return result


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    bounding_box = source.getchannel("A").getbbox()
    if not bounding_box:
        raise RuntimeError("Generated Janani mark has no visible pixels.")
    mark = source.crop(bounding_box)

    icon = Image.new("RGBA", (1024, 1024), "#FFF7F2")
    centered(icon, contain(mark, 720))
    icon.convert("RGB").save(ASSETS / "icon.png", optimize=True)

    adaptive = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    centered(adaptive, contain(mark, 640))
    adaptive.save(ASSETS / "adaptive-icon.png", optimize=True)

    splash = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    centered(splash, contain(mark, 360))
    splash.save(ASSETS / "splash-icon.png", optimize=True)

    favicon = Image.new("RGBA", (64, 64), "#FFF7F2")
    centered(favicon, contain(mark, 48))
    favicon.save(ASSETS / "favicon.png", optimize=True)

    notification = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
    centered(notification, white_silhouette(contain(mark, 72)))
    notification.save(ASSETS / "notification-icon.png", optimize=True)

    monochrome = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    centered(monochrome, white_silhouette(contain(mark, 640)))
    monochrome.save(ASSETS / "monochrome-icon.png", optimize=True)

    for path in sorted(ASSETS.glob("*.png")):
        with Image.open(path) as image:
            print(f"{path.name}: {image.size} {image.mode}")


if __name__ == "__main__":
    main()
