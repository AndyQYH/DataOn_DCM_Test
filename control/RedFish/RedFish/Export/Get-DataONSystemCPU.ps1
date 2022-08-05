<#
.Synopsis
   Get DataON System CPU Status
.DESCRIPTION
   Get DataON System CPU Status like Health Status, TotalCores ...
.EXAMPLE
   Get-DataONSystemCPU -WebSession $WebSession -ComputerName $ComputerName -Id CPU1 -SkipCertificateCheck
.EXAMPLE
   Get-DataONSystemCPU -ComputerName $ComputerName -Credential 'admin' -Id CPU1 -SkipCertificateCheck

#>
function Get-DataONSystemCPU {
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

    $Uri = "https://" + $ComputerName + $system.Members.'@odata.id' + "/Processors"

    $cpu =  Invoke-RestMethod @PSBoundParameters -Uri $Uri 

    $cpu

    $cpu.Members |ForEach-Object {
        $Uri = "https://" + $ComputerName + $_.'@odata.id'
        Invoke-RestMethod @PSBoundParameters -Uri $Uri  
    }

    
    
}