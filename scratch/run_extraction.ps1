Add-Type -Path (Resolve-Path "scratch/CutoutGenerator.cs").Path -ReferencedAssemblies System.Drawing

$inputPath = (Resolve-Path "public/assets/reference-squid.jpg").Path
$outputPath = (Join-Path (Resolve-Path "public/assets").Path "squid-guard-isolated.png")

[CharacterExtraction.Processor]::GenerateCleanCharacter($inputPath, $outputPath)
