#!/bin/bash
cd "$(dirname "$0")"
SOURCE="logo.svg"
MAGICK=""
if command -v magick &>/dev/null; then
  MAGICK="magick"
elif command -v convert &>/dev/null; then
  MAGICK="convert"
else
  echo "ImageMagick not found. Install: brew install imagemagick"
  exit 1
fi

$MAGICK "$SOURCE" -background none -resize 16x16 favicon.png
$MAGICK "$SOURCE" -background none -resize 32x32 favicon32.png
$MAGICK "$SOURCE" -background none -resize 192x192 icon192.png
$MAGICK "$SOURCE" -background none -resize 512x512 icon512.png
echo "Icons generated: favicon.png favicon32.png icon192.png icon512.png"
