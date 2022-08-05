# MUST-RedFish

Create a Manifest
New-ModuleManifest -Path .\DataONMUST.psd1 -Author "DataON" -CompanyName "DataON"  -PowerShellVersion '6.0'

## Pester

    $ComputerName = "10.4.7.17"
    $PlainPassword = "admin1"
    $SecurePassword = $PlainPassword | ConvertTo-SecureString -AsPlainText -Force
    $UserName = "admin"
    $Credential = New-Object System.Management.Automation.PSCredential `
     -ArgumentList $UserName, $SecurePassword
    $WebSession = New-DataONSession -ComputerName $ComputerName -Credential `  $Credential -SkipCertificateCheck

    Invoke-Pester -Script @{ Path = '.\Tests\*.Tests.ps1' ; Parameters = @{Credential = $Credential; ComputerName = $ComputerName; WebSession = $WebSession}}
