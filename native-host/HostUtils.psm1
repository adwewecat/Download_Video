<#
.SYNOPSIS
  HostUtils.psm1 - Các hàm tiện ích thuần cho Chrome Native Messaging Host (PowerShell).
  Bao gồm đọc/ghi gói tin nhị phân, định dạng cookie, trích xuất log yt-dlp, và tính Extension ID.
#>

function Read-NativeMessage {
  [CmdletBinding()]
  param (
    [Parameter(Mandatory = $true)]
    [System.IO.Stream]$Stream
  )

  # Đọc 4 byte độ dài message (little-endian uint32)
  $lenBytes = New-Object byte[] 4
  $totalRead = 0
  while ($totalRead -lt 4) {
    $bytesRead = $Stream.Read($lenBytes, $totalRead, 4 - $totalRead)
    if ($bytesRead -eq 0) {
      if ($totalRead -eq 0) {
        return $null # EOF sạch (stream kết thúc bình thường)
      }
      throw "Mất kết nối đột ngột khi đang đọc độ dài gói tin native message"
    }
    $totalRead += $bytesRead
  }

  $msgLength = [System.BitConverter]::ToUInt32($lenBytes, 0)
  if ($msgLength -eq 0) {
    return $null
  }

  # Đọc toàn bộ phần nội dung JSON (UTF-8)
  $bodyBytes = New-Object byte[] $msgLength
  $bodyRead = 0
  while ($bodyRead -lt $msgLength) {
    $bytesRead = $Stream.Read($bodyBytes, $bodyRead, $msgLength - $bodyRead)
    if ($bytesRead -eq 0) {
      throw "Mất kết nối đột ngột khi đang đọc nội dung gói tin native message"
    }
    $bodyRead += $bytesRead
  }

  $jsonText = [System.Text.Encoding]::UTF8.GetString($bodyBytes)
  return ($jsonText | ConvertFrom-Json)
}

function Write-NativeMessage {
  [CmdletBinding()]
  param (
    [Parameter(Mandatory = $true)]
    [System.IO.Stream]$Stream,

    [Parameter(Mandatory = $true)]
    [object]$Object
  )

  $jsonText = ($Object | ConvertTo-Json -Compress -Depth 10)
  $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($jsonText)
  $msgLength = [uint32]$bodyBytes.Length
  $lenBytes = [System.BitConverter]::GetBytes($msgLength)

  $Stream.Write($lenBytes, 0, 4)
  $Stream.Write($bodyBytes, 0, $bodyBytes.Length)
  $Stream.Flush()
}

function ConvertTo-NetscapeCookieText {
  [CmdletBinding()]
  param (
    [Parameter(Mandatory = $true)]
    [object[]]$Cookies
  )

  $lines = [System.Collections.Generic.List[string]]::new()
  $lines.Add("# Netscape HTTP Cookie File")

  foreach ($c in $Cookies) {
    $domain = [string]$c.domain
    $hostOnly = [bool]$c.hostOnly
    $subdomains = if ($hostOnly) { "FALSE" } else { "TRUE" }
    if (-not $hostOnly -and -not $domain.StartsWith(".")) {
      $domain = "." + $domain
    }

    $path = if ($c.path) { [string]$c.path } else { "/" }
    $secure = if ($c.secure) { "TRUE" } else { "FALSE" }
    
    $exp = 0
    if ($c.PSObject.Properties['expirationDate'] -and $c.expirationDate) {
      $exp = [int64][Math]::Floor([double]$c.expirationDate)
    }

    $name = [string]$c.name
    $val = [string]$c.value

    $line = "$domain`t$subdomains`t$path`t$secure`t$exp`t$name`t$val"
    $lines.Add($line)
  }

  return ($lines -join "`n")
}

function Get-ProgressPercent {
  [CmdletBinding()]
  param (
    [Parameter(Mandatory = $true)]
    [string]$Line
  )

  if ($Line -match '\[dvi\]\s*([\d.]+)%') {
    return [double]$matches[1]
  }
  return $null
}

function Get-FinalFilePath {
  [CmdletBinding()]
  param (
    [Parameter(Mandatory = $true)]
    [string]$Line
  )

  if ($Line -match '\[dvifile\](.*)$') {
    return $matches[1].Trim()
  }
  return $null
}

function Get-MetaInfo {
  [CmdletBinding()]
  param (
    [Parameter(Mandatory = $true)]
    [string]$Line
  )

  if ($Line -match '\[dvimeta\]([^;]+);(\d+)') {
    return @{
      vcodec = $matches[1]
      height = [int]$matches[2]
    }
  }
  return $null
}

function Join-ProcessArguments {
  [CmdletBinding()]
  param (
    [Parameter(Mandatory = $true)]
    [AllowEmptyString()]
    [string[]]$Arguments
  )

  $quotedArgs = foreach ($arg in $Arguments) {
    if ($arg.Length -eq 0) {
      '""'
      continue
    }

    $needsQuotes = ($arg -match '[\s\t"]')
    if (-not $needsQuotes) {
      $arg
      continue
    }

    # Trích dẫn theo chuẩn CommandLineToArgvW của Windows
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.Append('"')
    $slashCount = 0

    for ($i = 0; $i -lt $arg.Length; $i++) {
      $char = $arg[$i]
      if ($char -eq '\') {
        $slashCount++
      } elseif ($char -eq '"') {
        [void]$sb.Append(('\' * ($slashCount * 2 + 1)))
        [void]$sb.Append('"')
        $slashCount = 0
      } else {
        if ($slashCount -gt 0) {
          [void]$sb.Append(('\' * $slashCount))
          $slashCount = 0
        }
        [void]$sb.Append($char)
      }
    }

    if ($slashCount -gt 0) {
      [void]$sb.Append(('\' * ($slashCount * 2)))
    }
    [void]$sb.Append('"')
    $sb.ToString()
  }

  return ($quotedArgs -join ' ')
}

function Get-YtDlpArguments {
  [CmdletBinding()]
  param (
    [Parameter(Mandatory = $true)]
    [string]$Url,

    [Parameter(Mandatory = $true)]
    [string]$OutDir,

    [Parameter(Mandatory = $false)]
    [string]$CookieFile,

    [Parameter(Mandatory = $false)]
    [string]$Quality = 'compatible'
  )

  $sortArg = if ($Quality -eq 'best') { 'res,ext:mp4:m4a' } else { 'vcodec:h264,res,acodec:m4a' }

  [string[]]$argsList = @(
    '--encoding', 'utf-8',
    '--newline',
    '--progress',
    '--progress-template', 'download:[dvi] %(progress._percent_str)s',
    '--print', 'after_move:[dvifile]%(filepath)s',
    '--print', 'after_move:[dvimeta]%(vcodec)s;%(height)s',
    '-f', 'bv*+ba/b',
    '-S', $sortArg,
    '--merge-output-format', 'mp4',
    '--no-playlist',
    '-P', $OutDir,
    '-o', '%(title).150B [%(id)s].%(ext)s'
  )

  if ($CookieFile) {
    $argsList += @('--cookies', $CookieFile)
  }

  $argsList += @('--', $Url)
  return ,$argsList
}

function Get-ExtensionIdFromKey {
  [CmdletBinding()]
  param (
    [Parameter(Mandatory = $true)]
    [string]$Base64Key
  )

  $derBytes = [System.Convert]::FromBase64String($Base64Key)
  $sha256 = [System.Security.Cryptography.SHA256]::Create()
  $hash = $sha256.ComputeHash($derBytes)

  $sb = New-Object System.Text.StringBuilder
  for ($i = 0; $i -lt 16; $i++) {
    $b = $hash[$i]
    $hi = ($b -shr 4) -band 0x0F
    $lo = $b -band 0x0F
    [void]$sb.Append([char]([int][char]'a' + $hi))
    [void]$sb.Append([char]([int][char]'a' + $lo))
  }

  return $sb.ToString()
}

function Get-DownloadsFolder {
  [CmdletBinding()]
  param ()

  try {
    $shell = New-Object -ComObject Shell.Application
    $folder = $shell.NameSpace('shell:Downloads')
    if ($folder -and $folder.Self.Path) {
      return $folder.Self.Path
    }
  } catch {
    # Bỏ qua lỗi COM và fallback về thư mục mặc định
  }

  return (Join-Path $env:USERPROFILE "Downloads")
}

Export-ModuleMember -Function @(
  'Read-NativeMessage',
  'Write-NativeMessage',
  'ConvertTo-NetscapeCookieText',
  'Get-ProgressPercent',
  'Get-FinalFilePath',
  'Get-MetaInfo',
  'Join-ProcessArguments',
  'Get-YtDlpArguments',
  'Get-ExtensionIdFromKey',
  'Get-DownloadsFolder'
)
