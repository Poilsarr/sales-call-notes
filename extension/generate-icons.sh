#!/bin/bash
cd "$(dirname "$0")"
SOURCE="icon.svg"
MAGICK=""
if command -v magick &>/dev/null; then
  MAGICK="magick"
elif command -v convert &>/dev/null; then
  MAGICK="convert"
else
  echo "ImageMagick not found. Install: brew install imagemagick"
  exit 1
fi

$MAGICK "$SOURCE" -background none -resize 16x16 icon16.png
$MAGICK "$SOURCE" -background none -resize 48x48 icon48.png
$MAGICK "$SOURCE" -background none -resize 128x128 icon128.png
echo "Extension icons generated: icon16.png icon48.png icon128.png"
