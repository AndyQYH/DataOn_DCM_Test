<#
.Synopsis
   Get DataON System Power Info 
.DESCRIPTION
   Get DataON System Power Info
.EXAMPLE
   Get-DataONSystemPower -WebSession $WebSession -ComputerName $ComputerName -SkipCertificateCheck
.EXAMPLE
   Get-DataONSystemPower -ComputerName $ComputerName -Credential 'admin' -SkipCertificateCheck

#>
function Get-DataONSystemPower {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory)]
        [ValidateNotNullOrEmpty()]
        [String] $ComputerName,
        [PSCredential] $Credential,
        [Microsoft.PowerShell.Commands.WebRequestSession] $WebSession,
        [switch] $SkipCertificateCheck
    )

    $Uri = "https://" + $ComputerName + "/redfish/v1/Chassis/RackMount/Baseboard/Power"

    $PSBoundParameters.Remove('ComputerName')
    $PSBoundParameters.Add('Uri', $Uri)

    Invoke-RestMethod @PSBoundParameters
    
    
}