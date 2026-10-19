Add-Type -AssemblyName System.Drawing

$srcPath = (Resolve-Path "public/assets/reference-squid.jpg").Path
$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$w = $bmp.Width   # 1024
$h = $bmp.Height  # 636

# Find min and max X, Y of the character
# The character has either:
# 1. Red suit: R > 60 and R > G * 1.4 and R > B * 1.3
# 2. White circle on mask: in x: 410..520, y: 130..280 where R>150, G>150, B>150
# 3. Mask mesh: in x: 410..520, y: 130..360 surrounded by red hood

Write-Output "Image size: $w x $h"

# Create a mask array [w, h] of booleans
$mask = New-Object 'bool[,]' $w, $h

for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        $pix = $bmp.GetPixel($x, $y)
        $r = [int]$pix.R
        $g = [int]$pix.G
        $b = [int]$pix.B

        $isChar = $false

        # Only look in central region where guard is (x between 380 and 720)
        if ($x -ge 380 -and $x -le 720 -and $y -ge 100) {
            # Red suit test
            if ($r -gt 55 -and $r -gt ($g * 1.35) -and $r -gt ($b * 1.2)) {
                $isChar = $true
            }
            # Mask white circle
            elseif ($x -ge 415 -and $x -le 490 -and $y -ge 140 -and $y -le 260 -and $r -gt 140 -and $g -gt 140 -and $b -gt 140) {
                $isChar = $true
            }
            # Black mesh of mask (inside hood boundary)
            elseif ($x -ge 415 -and $x -le 510 -and $y -ge 150 -and $y -le 355) {
                # In this region, mask has dark grey mesh texture
                $isChar = $true
            }
            # Collar / zipper / shadow under chin
            elseif ($x -ge 440 -and $x -le 520 -and $y -ge 340 -and $y -le 410 -and $r -gt 35) {
                $isChar = $true
            }
            # Black belt at bottom
            elseif ($x -ge 430 -and $x -le 540 -and $y -ge 600 -and $y -le 635) {
                $isChar = $true
            }
        }

        $mask[$x, $y] = $isChar
    }
}

# Morphological dilate (3 iterations) to ensure smooth full coverage and no holes
$dilated = New-Object 'bool[,]' $w, $h
for ($y = 1; $y -lt ($h - 1); $y++) {
    for ($x = 1; $x -lt ($w - 1); $x++) {
        $dilated[$x, $y] = $mask[$x, $y] -or $mask[$x-1, $y] -or $mask[$x+1, $y] -or $mask[$x, $y-1] -or $mask[$x, $y+1]
    }
}

# Second dilate
$dilated2 = New-Object 'bool[,]' $w, $h
for ($y = 2; $y -lt ($h - 2); $y++) {
    for ($x = 2; $x -lt ($w - 2); $x++) {
        $dilated2[$x, $y] = $dilated[$x, $y] -or $dilated[$x-1, $y] -or $dilated[$x+1, $y] -or $dilated[$x, $y-1] -or $dilated[$x, $y+1]
    }
}

# Find bounding box
$minX = $w; $maxX = 0; $minY = $h; $maxY = 0
for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        if ($dilated2[$x, $y]) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Output "Character Bounding Box: X=$minX..$maxX, Y=$minY..$maxY"

# Add small padding
$pad = 6
$cropX = [Math]::Max(0, $minX - $pad)
$cropY = [Math]::Max(0, $minY - $pad)
$cropW = [Math]::Min($w - $cropX, ($maxX - $minX) + ($pad * 2))
$cropH = [Math]::Min($h - $cropY, ($maxY - $minY) + ($pad * 2))

# Create clean transparent PNG
$cutout = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

for ($cy = 0; $cy -lt $cropH; $cy++) {
    $gy = $cropY + $cy
    for ($cx = 0; $cx -lt $cropW; $cx++) {
        $gx = $cropX + $cx
        if ($dilated2[$gx, $gy]) {
            $pix = $bmp.GetPixel($gx, $gy)
            $cutout.SetPixel($cx, $cy, $pix)
        } else {
            # 100% transparent
            $cutout.SetPixel($cx, $cy, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        }
    }
}

$outPath = (Join-Path (Resolve-Path "public/assets").Path "squid-guard-isolated.png")
$cutout.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

$cutout.Dispose()
$bmp.Dispose()

Write-Output "Successfully saved isolated character: $outPath ($cropW x $cropH)"
