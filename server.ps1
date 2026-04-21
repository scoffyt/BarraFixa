$ErrorActionPreference = "Stop"

$port = 8080
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
$listener.Start()

$contentTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".js" = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".webp" = "image/webp"
  ".png" = "image/png"
  ".jpg" = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".svg" = "image/svg+xml"
  ".ico" = "image/x-icon"
}

function Send-Response {
  param(
    [System.Net.Sockets.NetworkStream] $Stream,
    [int] $StatusCode,
    [string] $StatusText,
    [byte[]] $Body,
    [string] $ContentType
  )

  $header = @(
    "HTTP/1.1 $StatusCode $StatusText",
    "Content-Type: $ContentType",
    "Content-Length: $($Body.Length)",
    "Connection: close",
    ""
    ""
  ) -join "`r`n"

  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  $Stream.Write($Body, 0, $Body.Length)
}

Write-Host "Servidor local ativo em http://localhost:$port/"

while ($true) {
  $client = $listener.AcceptTcpClient()

  try {
    $stream = $client.GetStream()
    $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
    $requestLine = $reader.ReadLine()

    if (-not $requestLine) {
      $client.Close()
      continue
    }

    while ($reader.ReadLine()) { }

    $parts = $requestLine.Split(" ")
    $rawPath = if ($parts.Length -ge 2) { $parts[1] } else { "/" }
    $decodedPath = [System.Uri]::UnescapeDataString(($rawPath.Split("?")[0])).TrimStart("/")

    if ([string]::IsNullOrWhiteSpace($decodedPath)) {
      $decodedPath = "index.html"
    }

    $decodedPath = $decodedPath -replace "/", "\"
    $fullPath = Join-Path $root $decodedPath

    if ((Test-Path $fullPath) -and -not (Get-Item $fullPath).PSIsContainer) {
      $extension = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()
      $contentType = $contentTypes[$extension]
      if (-not $contentType) {
        $contentType = "application/octet-stream"
      }

      $bytes = [System.IO.File]::ReadAllBytes($fullPath)
      Send-Response -Stream $stream -StatusCode 200 -StatusText "OK" -Body $bytes -ContentType $contentType
    } else {
      $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 - Arquivo não encontrado")
      Send-Response -Stream $stream -StatusCode 404 -StatusText "Not Found" -Body $bytes -ContentType "text/plain; charset=utf-8"
    }
  } catch {
    if ($stream) {
      $bytes = [System.Text.Encoding]::UTF8.GetBytes("500 - Erro interno")
      Send-Response -Stream $stream -StatusCode 500 -StatusText "Internal Server Error" -Body $bytes -ContentType "text/plain; charset=utf-8"
    }
  } finally {
    if ($reader) {
      $reader.Dispose()
    }

    if ($stream) {
      $stream.Dispose()
    }

    $client.Close()
  }
}
