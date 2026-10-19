Add-Type -AssemblyName System.Drawing

$sourcePath = (Resolve-Path "public/assets/reference-squid.jpg").Path
$source = [System.Drawing.Bitmap]::FromFile($sourcePath)

$w = $source.Width
$h = $source.Height

# Character bounding box in the 1024x636 image
# The character spans roughly from x=360 to x=680, and y=50 to y=636
$cropX = 350
$cropY = 50
$cropW = 340
$cropH = $h - $cropY

$target = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($target)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

$srcRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
$destRect = New-Object System.Drawing.Rectangle(0, 0, $cropW, $cropH)
$g.DrawImage($source, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

# Now create an alpha-feathered / background-suppressed version
# In the background outside the character, colors are very dark (R,G,B < 25)
$outBmp = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

for ($y = 0; $y -lt $cropH; $y++) {
    for ($x = 0; $x -lt $cropW; $x++) {
        $pixel = $target.GetPixel($x, $y)
        $r = [int]$pixel.R
        $gCol = [int]$pixel.G
        $b = [int]$pixel.B
        
        # Distance from horizontal edges
        $distFromEdge = [Math]::Min($x, $cropW - 1 - $x)
        $fadeFactor = 1.0
        if ($distFromEdge -lt 40) {
            $fadeFactor = $distFromEdge / 40.0
        }
        if ($y -lt 30) {
            $fadeFactor = [Math]::Min($fadeFactor, $y / 30.0)
        }
        
        # If the pixel is very dark background (near black)
        $brightness = ($r * 0.299 + $gCol * 0.587 + $b * 0.114)
        $alpha = 255
        
        # If outside character or pure black ambient
        if ($brightness -lt 12 -and ($distFromEdge -lt 70 -or $y -lt 50)) {
            $alpha = [int](255 * ($brightness / 12.0) * $fadeFactor)
        } else {
            $alpha = [int](255 * $fadeFactor)
        }
        
        if ($alpha -gt 255) { $alpha = 255 }
        if ($alpha -lt 0) { $alpha = 0 }
        
        $newCol = [System.Drawing.Color]::FromArgb($alpha, $r, $gCol, $b)
        $outBmp.SetPixel($x, $y, $newCol)
    }
}

$outPath = (Join-Path (Resolve-Path "public/assets").Path "character-squid.png")
$outBmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

$target.Dispose()
$outBmp.Dispose()
$source.Dispose()

Write-Output "Character extracted to $outPath successfully"
