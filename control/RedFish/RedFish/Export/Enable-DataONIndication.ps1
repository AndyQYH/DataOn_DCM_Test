<#
.Synopsis
   Turn on DataON System Indicatior LED
.DESCRIPTION
   Turn on DataON System Indicatior LED. The result will be 'Blinking'
.EXAMPLE
   Enable-DataONIndication -WebSession $WebSession -ComputerName $ComputerName -SkipCertificateCheck
.EXAMPLE
   Enable-DataONIndication -ComputerName $ComputerName -Credential 'admin' -SkipCertificateCheck

#>
function Enable-DataONIndication {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory)]
        [ValidateNotNullOrEmpty()]
        [String] $ComputerName,
        [PSCredential] $Credential,
        [Microsoft.PowerShell.Commands.WebRequestSession] $WebSession,
        [switch] $SkipCertificateCheck
    )

    $Payload = @{"IndicatorLED" = "Blinking";}
    $Uri = "https://" + $ComputerName + "/redfish/v1/Systems"

    $PSBoundParameters.Remove('ComputerName') | Out-Null

    $system =  Invoke-RestMethod @PSBoundParameters -Uri $Uri

    $Uri = "https://" + $ComputerName + $system.Members.'@odata.id'

    Invoke-RestMethod @PSBoundParameters -Uri $Uri -Body $($Payload | ConvertTo-Json) -Method Patch

    
}