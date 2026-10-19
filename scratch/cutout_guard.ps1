Add-Type -AssemblyName System.Drawing

$srcPath = (Resolve-Path "public/assets/reference-squid.jpg").Path
$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$w = $bmp.Width
$h = $bmp.Height

# Create high-res transparent bitmap for the cutout
$cutout = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Define character boundary points (polygon) in the 1024x636 image:
# Top hood peak: (530, 115)
# Hood curve to back: (590, 140), (630, 190), (660, 260), (665, 305)
# Shoulder & back: (710, 360), (730, 420), (745, 520), (720, 600), (690, 636)
# Bottom base: (430, 636)
# Belt & belly: (435, 615), (420, 560), (445, 480)
# Chest & zipper: (465, 420), (475, 370)
# Mask & chin: (445, 350), (420, 280), (410, 220), (425, 170), (455, 135), (490, 120)

$points = @(
    New-Object System.Drawing.Point(530, 115),
    New-Object System.Drawing.Point(565, 125),
    New-Object System.Drawing.Point(600, 150),
    New-Object System.Drawing.Point(635, 195),
    New-Object System.Drawing.Point(660, 250),
    New-Object System.Drawing.Point(670, 300),
    New-Object System.Drawing.Point(710, 355),
    New-Object System.Drawing.Point(735, 415),
    New-Object System.Drawing.Point(748, 510),
    New-Object System.Drawing.Point(730, 595),
    New-Object System.Drawing.Point(705, 636),
    New-Object System.Drawing.Point(430, 636),
    New-Object System.Drawing.Point(430, 615),
    New-Object System.Drawing.Point(415, 555),
    New-Object System.Drawing.Point(440, 475),
    New-Object System.Drawing.Point(465, 425),
    New-Object System.Drawing.Point(475, 370),
    New-Object System.Drawing.Point(445, 350),
    New-Object System.Drawing.Point(418, 280),
    New-Object System.Drawing.Point(412, 220),
    New-Object System.Drawing.Point(425, 168),
    New-Object System.Drawing.Point(455, 135),
    New-Object System.Drawing.Point(490, 120)
)

$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddPolygon($points)

# Draw image clipped to the character silhouette with soft anti-aliased feather
$g = [System.Drawing.Graphics]::FromImage($cutout)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# Set clip region to path
$region = New-Object System.Drawing.Region($path)
$g.Clip = $region
$g.DrawImage($bmp, 0, 0, $w, $h)

$g.Dispose()
$path.Dispose()
$region.Dispose()

# Now crop tightly to the character bounding box with margin
# X roughly 400 to 760, Y roughly 110 to 636
$cropRect = New-Object System.Drawing.Rectangle(400, 105, 360, 531)
$finalBmp = New-Object System.Drawing.Bitmap($cropRect.Width, $cropRect.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gFinal = [System.Drawing.Graphics]::FromImage($finalBmp)
$gFinal.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$gFinal.DrawImage($cutout, 0, 0, $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
$gFinal.Dispose()

# Save transparent PNG
$outPath = (Join-Path (Resolve-Path "public/assets").Path "squid-guard-transparent.png")
$finalBmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

$finalBmp.Dispose()
$cutout.Dispose()
$bmp.Dispose()

Write-Output "Created transparent character cutout: $outPath"
