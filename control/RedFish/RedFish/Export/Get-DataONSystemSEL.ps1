<#
.Synopsis
   Get DataON System SEL log
.DESCRIPTION
   Get DataON System SEL log
.EXAMPLE
   Get-DataONSystemSEL -WebSession $WebSession -ComputerName $ComputerName -SkipCertificateCheck
.EXAMPLE
   Get-DataONSystemSEL -ComputerName $ComputerName -Credential 'admin' -SkipCertificateCheck

#>
function Get-DataONSystemSEL {
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

    $Uri = "https://" + $ComputerName + $system.Members.'@odata.id' + '/LogServices/SEL/Entries'

    $count = (Invoke-RestMethod @PSBoundParameters -Uri $Uri).'Members@odata.count'

    if($count -gt 50 ) {
        $Uri = $Uri + '?$skiptoken=' + $($count - 50)
    }

    $entries =  Invoke-RestMethod @PSBoundParameters -Uri $Uri

    $entries.Members
    
    
}