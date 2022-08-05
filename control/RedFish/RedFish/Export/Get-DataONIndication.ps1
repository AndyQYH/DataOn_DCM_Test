<#
.Synopsis
   Get the status of DataON System Indicatior LED
.DESCRIPTION
   Get the status of DataON System Indicatior LED. The result can be 'Blinking', 'off'
.EXAMPLE
   Get-DataONIndication -WebSession $WebSession -ComputerName $ComputerName -SkipCertificateCheck
.EXAMPLE
   Get-DataONIndication -ComputerName $ComputerName -Credential 'admin' -SkipCertificateCheck

#>
function Get-DataONIndication {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory)]
        [ValidateNotNullOrEmpty()]
        [String] $ComputerName,
        [PSCredential] $Credential,
        [Microsoft.PowerShell.Commands.WebRequestSession] $WebSession,
        [switch] $SkipCertificateCheck
    )

    $Uri = "https://" + $ComputerName + "/redfish/v1/Systems"

    $PSBoundParameters.Remove('ComputerName') | Out-Null

    $system = Invoke-RestMethod @PSBoundParameters -Uri $Uri

    $Uri = "https://" + $ComputerName + $system.Members.'@odata.id'

    Invoke-RestMethod @PSBoundParameters -Uri $Uri | Select-Object IndicatorLED 
    
    
}