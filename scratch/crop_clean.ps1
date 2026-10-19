Add-Type -AssemblyName System.Drawing

$srcPath = (Resolve-Path "public/assets/reference-squid.jpg").Path
$source = [System.Drawing.Bitmap]::FromFile($srcPath)

$w = $source.Width   # 1024
$h = $source.Height  # 636

# In the 1024x636 image:
# Character starts roughly at X=380 and ends around X=665
# Y goes from top of hood (Y=110) to bottom of frame (Y=636)
$cropX = 370
$cropY = 90
$cropW = 310
$cropH = $h - $cropY

$cropped = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($cropped)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$srcRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
$destRect = New-Object System.Drawing.Rectangle(0, 0, $cropW, $cropH)
$g.DrawImage($source, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

# Save clean cropped character
$outCropped = (Join-Path (Resolve-Path "public/assets").Path "squid-guard-clean.png")
$cropped.Save($outCropped, [System.Drawing.Imaging.ImageFormat]::Png)

# Also create background plate:
# For the background plate, we blur or sample the corridor background and metal wall
# We can create a seamless clean background asset
$bgW = 1024
$bgH = 636
$bg = New-Object System.Drawing.Bitmap($bgW, $bgH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gBg = [System.Drawing.Graphics]::FromImage($bg)
$gBg.DrawImage($source, 0, 0)
$gBg.Dispose()

# In the center where the guard is (x: 370 to 680), fill with the dark corridor wall color (#07090f)
# with smooth horizontal blend so the background can exist behind the floating parallax character!
for ($y = 0; $y -lt $bgH; $y++) {
    for ($x = 340; $x -lt 700; $x++) {
        # sample wall colors from left (x=330) and right (x=710)
        $leftPix = $source.GetPixel(330, [Math]::Min($y, $bgH - 1))
        $rightPix = $source.GetPixel(710, [Math]::Min($y, $bgH - 1))
        
        $t = ($x - 340) / (700 - 340)
        # smoothstep
        $t = $t * $t * (3.0 - 2.0 * $t)
        
        $r = [int]($leftPix.R * (1 - $t) + $rightPix.R * $t)
        $gCol = [int]($leftPix.G * (1 - $t) + $rightPix.G * $t)
        $b = [int]($leftPix.B * (1 - $t) + $rightPix.B * $t)
        
        # In the corridor center wall, keep it very dark
        if ($y -gt 450) {
            # floor area - subtle floor reflection
            $r = [Math]::Min($r, 12)
            $gCol = [Math]::Min($gCol, 10)
            $b = [Math]::Min($b, 18)
        } else {
            $r = [Math]::Min($r, 10)
            $gCol = [Math]::Min($gCol, 9)
            $b = [Math]::Min($b, 14)
        }
        
        $bg.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $r, $gCol, $b))
    }
}

$outBg = (Join-Path (Resolve-Path "public/assets").Path "corridor-bg.png")
$bg.Save($outBg, [System.Drawing.Imaging.ImageFormat]::Png)

$cropped.Dispose()
$bg.Dispose()
$source.Dispose()

Write-Output "Generated squid-guard-clean.png and corridor-bg.png"
