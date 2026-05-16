#!/bin/bash
# Generate Chrome extension PNG icons from SVG source
# Requires ImageMagick: brew install imagemagick

SOURCE="icon.svg"

if command -v convert &> /dev/null; then
  echo "Generating icons with ImageMagick..."
  convert -background none -resize 16x16 "$SOURCE" icon16.png
  convert -background none -resize 48x48 "$SOURCE" icon48.png
  convert -background none -resize 128x128 "$SOURCE" icon128.png
  echo "Icons generated: icon16.png icon48.png icon128.png"
else
  echo "ImageMagick not found. Install with: brew install imagemagick"
  exit 1
fi
