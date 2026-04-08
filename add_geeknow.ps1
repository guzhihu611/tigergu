$c = [System.IO.File]::ReadAllText('f:\AI-Tiger V1.0\config\modelConfig.js', [System.Text.Encoding]::UTF8)
$idx = $c.IndexOf("'geeknow':{'name':'GeekNow','icon':'GN','description':'GeekNow AI ")
$endMarker = "'runninghub':{'name':"
$endIdx = $c.IndexOf($endMarker, $idx)
$badBlock = $c.Substring($idx, $endIdx - $idx)
$newBlock = "'geeknow':{'name':'GeekNow','icon':'GN','description':'GeekNow AI Image Generation','isTextIcon':true,'models':[{'id':'geeknow/seedream-4.0','name':'Seedream V4','description':'4K image generation','icon':'images/jimeng.png'},{'id':'geeknow/seedream-4.5','name':'Seedream V4.5','description':'Advanced image generation','icon':'images/jimeng.png'},{'id':'geeknow/seedream-5.0-lite','name':'Seedream V5 Lite','description':'Fast creative style generation','icon':'images/jimeng.png'},{'id':'geeknow/nano-banana-2','name':'Nano Banana 2','description':'Cost-effective image generation','icon':'images/jimeng.png'},{'id':'geeknow/nano-banana-pro','name':'Nano Banana Pro','description':'Professional high-quality generation','icon':'images/jimeng.png'}]},"
$c = $c.Remove($idx, $badBlock.Length)
$c = $c.Insert($idx, $newBlock)
[System.IO.File]::WriteAllText('f:\AI-Tiger V1.0\config\modelConfig.js', $c, [System.Text.Encoding]::UTF8)
Write-Output "Fixed geeknow model config with ASCII descriptions"
