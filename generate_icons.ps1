Add-Type -AssemblyName System.Drawing
$sourcePath = "c:\Projects\gym_tracker\src\assets\logo\notebook_with_dumbell_app_symbol.png"
$img = [System.Drawing.Image]::FromFile($sourcePath)

$b192 = New-Object System.Drawing.Bitmap(192, 192)
$g192 = [System.Drawing.Graphics]::FromImage($b192)
$g192.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g192.DrawImage($img, 0, 0, 192, 192)
$b192.Save("c:\Projects\gym_tracker\src\assets\icons\icon-192x192.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g192.Dispose()
$b192.Dispose()

$b512 = New-Object System.Drawing.Bitmap(512, 512)
$g512 = [System.Drawing.Graphics]::FromImage($b512)
$g512.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g512.DrawImage($img, 0, 0, 512, 512)
$b512.Save("c:\Projects\gym_tracker\src\assets\icons\icon-512x512.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g512.Dispose()
$b512.Dispose()

$img.Dispose()
Write-Output "Icons generated successfully!"
