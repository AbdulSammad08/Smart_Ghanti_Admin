# Download and install prebuilt dlib wheel for Python 3.10 Windows

$tempDir = $env:TEMP
$wheelFile = Join-Path $tempDir "dlib-19.24.6-cp310-cp310-win_amd64.whl"

Write-Host "Downloading dlib wheel from GitHub..."
$url = "https://github.com/z-mahmud22/Dlib_Windows_Python3.x/releases/download/v19.24.6/dlib-19.24.6-cp310-cp310-win_amd64.whl"

$webClient = New-Object System.Net.WebClient
$webClient.DownloadFile($url, $wheelFile)
Write-Host "Downloaded to $wheelFile"

Write-Host "Installing dlib from wheel..."
pip install $wheelFile

Write-Host "Cleaning up..."
Remove-Item $wheelFile -Force -ErrorAction SilentlyContinue
Write-Host "Done!"

