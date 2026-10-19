Add-Type -AssemblyName System.Drawing

$srcPath = (Resolve-Path "public/assets/corridor-bg.png").Path
$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)

# 1. Clean top-left logo (x: 20 to 120, y: 15 to 65) - pure black corridor ceiling
$g = [System.Drawing.Graphics]::FromImage($bmp)
$brushCeiling = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 6, 8, 14))
$g.FillRectangle($brushCeiling, 20, 15, 110, 55)

# 2. Clean top-right MENU (x: 900 to 985, y: 15 to 60)
$g.FillRectangle($brushCeiling, 900, 15, 85, 50)

# 3. Clean right navigation dots (x: 935 to 975, y: 275 to 370)
# Dark wall color here is roughly (10, 8, 16)
$brushWall = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 9, 7, 14))
$g.FillRectangle($brushWall, 935, 275, 40, 95)

# 4. Clean bottom-right star (x: 940 to 990, y: 570 to 630)
# Floor color here is (7, 8, 14)
$brushFloor = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 7, 8, 13))
$g.FillRectangle($brushFloor, 940, 570, 55, 60)

$brushCeiling.Dispose()
$brushWall.Dispose()
$brushFloor.Dispose()
$g.Dispose()

$cleanBgPath = (Join-Path (Resolve-Path "public/assets").Path "cinematic-corridor-clean.png")
$bmp.Save($cleanBgPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Write-Output "Saved cinematic-corridor-clean.png without any baked UI artifacts"
