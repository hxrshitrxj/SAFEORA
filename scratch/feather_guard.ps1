Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile((Resolve-Path "public/assets/reference-squid.jpg").Path)
$w = $src.Width
$h = $src.Height

# Character begins at x=390 and ends around x=690
# We crop x: 315 to 750 (width: 435) - perfectly between the left and right doors
$cropX = 315
$cropY = 30
$cropW = 435
$cropH = $h - $cropY

$cropped = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($cropped)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$srcRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
$destRect = New-Object System.Drawing.Rectangle(0, 0, $cropW, $cropH)
$g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

# Feather the edges so there is ZERO rectangular seam:
# Left and right 75 pixels fade smoothly to alpha 0
# Top 50 pixels fade smoothly to alpha 0
# Bottom 35 pixels fade smoothly to alpha 0
for ($y = 0; $y -lt $cropH; $y++) {
    for ($x = 0; $x -lt $cropW; $x++) {
        $pix = $cropped.GetPixel($x, $y)
        
        $fadeX = 1.0
        if ($x -lt 75) {
            $fadeX = [Math]::Pow($x / 75.0, 1.6)
        } elseif ($x -gt ($cropW - 75)) {
            $fadeX = [Math]::Pow(($cropW - $x) / 75.0, 1.6)
        }
        
        $fadeY = 1.0
        if ($y -lt 55) {
            $fadeY = [Math]::Pow($y / 55.0, 1.6)
        } elseif ($y -gt ($cropH - 35)) {
            $fadeY = [Math]::Pow(($cropH - $y) / 35.0, 1.6)
        }
        
        $alpha = [int](255 * $fadeX * $fadeY)
        if ($alpha -gt 255) { $alpha = 255 }
        if ($alpha -lt 0) { $alpha = 0 }
        
        $newCol = [System.Drawing.Color]::FromArgb($alpha, $pix.R, $pix.G, $pix.B)
        $cropped.SetPixel($x, $y, $newCol)
    }
}

$outPath = (Join-Path (Resolve-Path "public/assets").Path "squid-guard-hero-feathered.png")
$cropped.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

$cropped.Dispose()
$src.Dispose()

Write-Output "Created clean seamless feathered wide character: $outPath ($cropW x $cropH)"
