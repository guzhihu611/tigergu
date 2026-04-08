$path = 'f:\AI-Tiger V1.0\main.js'
$content = [System.IO.File]::ReadAllText($path)
$content = $content.Replace('CanvasProjectDropdownManager', 'TigerProjectDropdownManager')
$content = $content.Replace('CanvasTabManager', 'TigerTabManager')
[System.IO.File]::WriteAllText($path, $content)
Write-Output 'Replacement done'
Write-Output "Contains CanvasTabManager: $($content.Contains('CanvasTabManager'))"
Write-Output "Contains CanvasProjectDropdownManager: $($content.Contains('CanvasProjectDropdownManager'))"
Write-Output "Contains TigerTabManager: $($content.Contains('TigerTabManager'))"
Write-Output "Contains TigerProjectDropdownManager: $($content.Contains('TigerProjectDropdownManager'))"
