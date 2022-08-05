<#
.Synopsis
   Get DataON System Metrics
.DESCRIPTION
   Get DataON System Metrics like ProcessorBandwidthPercent, MemoryBandwidthPercent, IOBandwidthGBps ...
.EXAMPLE
   Get-DataONSystemMetrics -WebSession $WebSession -ComputerName $ComputerName -SkipCertificateCheck
.EXAMPLE
   Get-DataONSystemMetrics -ComputerName $ComputerName -Credential 'admin' -SkipCertificateCheck

#>
function Get-DataONSystemThermal {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory)]
        [ValidateNotNullOrEmpty()]
        [String] $ComputerName,
        [PSCredential] $Credential,
        [Microsoft.PowerShell.Commands.WebRequestSession] $WebSession,
        [switch] $SkipCertificateCheck
    )

    $Uri = "https://" + $ComputerName + "/redfish/v1/Chassis/RackMount/Baseboard/Thermal"

    $PSBoundParameters.Remove('ComputerName') | Out-Null

    #$system =  Invoke-RestMethod @PSBoundParameters -Uri $Uri

    #$Uri = "https://" + $ComputerName + $system.Members.'@odata.id' + '/Metrics'

    Invoke-RestMethod @PSBoundParameters -Uri $Uri 
    
    
}