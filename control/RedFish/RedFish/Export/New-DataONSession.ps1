<#
.Synopsis
   Get New WebSession to access DataON System Redfish
.DESCRIPTION
   Get New WebSession to access DataON System Redfish. With WebSession, user do not need Cerdential on every request 
.EXAMPLE
   New-DataONSession -ComputerName $ComputerName -Credential 'admin' -SkipCertificateCheck

#>
function New-DataONSession {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory)]
        [ValidateNotNullOrEmpty()]
        [String] $ComputerName,
        
        [Parameter(Mandatory)]
        [ValidateNotNullOrEmpty()]
        [PSCredential] $Credential,
        [switch] $SkipCertificateCheck
    )

    [Uri] $Uri = "https://" + $ComputerName + "/redfish/v1/SessionService"

    $PSBoundParameters.Remove('ComputerName') | Out-Null

    $system =  Invoke-RestMethod @PSBoundParameters -Uri $Uri

    Write-Host "member:" $system.Members.'@odata.id'

    $Uri = "https://" + $ComputerName + $system.Members.'@odata.id'
    
    Invoke-RestMethod @PSBoundParameters -Uri $Uri -SessionVariable result | Out-Null 
  
    $result
  
}