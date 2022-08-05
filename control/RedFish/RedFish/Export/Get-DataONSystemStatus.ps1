<#
.Synopsis
   Get DataON System Status
.DESCRIPTION
   Get DataON System Status like Health Status, Power Status, SerialNumber, Model and PartNumber
.EXAMPLE
   Get-DataONSystemStatus -WebSession $WebSession -ComputerName $ComputerName -SkipCertificateCheck
.EXAMPLE
   Get-DataONSystemStatus -ComputerName $ComputerName -Credential 'admin' -SkipCertificateCheck

#>
function Get-DataONSystemStatus {
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

    $system =  Invoke-RestMethod @PSBoundParameters -Uri $Uri

    $Uri = "https://" + $ComputerName + $system.Members.'@odata.id'

    Invoke-RestMethod @PSBoundParameters -Uri $Uri | Select-Object Status, SerialNumber, Manufacturer, Model, PartNumber, PowerState, AssetTag, UUID, BiosVersion, ProcessorSummary, MemorySummary, IndicatorLED  
    
    
}