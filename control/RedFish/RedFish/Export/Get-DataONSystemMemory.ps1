<#
.Synopsis
   Get DataON System Memory Status
.DESCRIPTION
   Get DataON System Memory Status like Health Status and TotalSystemMemoryGiB
.EXAMPLE
   Get-DataONSystemMemory -WebSession $WebSession -ComputerName $ComputerName -SkipCertificateCheck
.EXAMPLE
   Get-DataONSystemMemory -ComputerName $ComputerName -Credential 'admin' -SkipCertificateCheck

#>
function Get-DataONSystemMemory {
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

    $Uri = "https://" + $ComputerName + $system.Members.'@odata.id' + '/Memory'

    $memory =  Invoke-RestMethod @PSBoundParameters -Uri $Uri

    $memory.Members |ForEach-Object {
        $Uri = "https://" + $ComputerName + $_.'@odata.id'
        Invoke-RestMethod @PSBoundParameters -Uri $Uri  
    }

    
    
    
}