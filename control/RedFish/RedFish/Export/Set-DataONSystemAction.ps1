<#
.Synopsis
   Order DataON System tp preform specific Action
.DESCRIPTION
   Order DataON System tp preform specific Action like power on, power off, restart ... 
.EXAMPLE
   Set-DataONSystemAction -WebSession $WebSession -ComputerName $ComputerName -Action On -SkipCertificateCheck
.EXAMPLE
   Set-DataONSystemAction -ComputerName $ComputerName -Credential 'admin' -Action GracefulShutdown-SkipCertificateCheck

#>
function Set-DataONSystemAction {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory)]
        [ValidateNotNullOrEmpty()]
        [String] $ComputerName,
        [PSCredential] $Credential,
        [Microsoft.PowerShell.Commands.WebRequestSession] $WebSession,

        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [ValidateSet('On', 'GracefulShutdown', 'ForceRestart', 'ForceOn', 'ForceOff', 'PushPowerButton', 'Nmi')]
        [String]$Action,

        [switch] $SkipCertificateCheck
    )

    $Payload = @{"ResetType" = $Action;}

    $Uri = "https://" + $ComputerName + "/redfish/v1/Systems"

    $PSBoundParameters.Remove('ComputerName') | Out-Null

    $PSBoundParameters.Remove('Action') | Out-Null

    $system =  Invoke-RestMethod @PSBoundParameters -Uri $Uri

    $Uri = "https://" + $ComputerName + $system.Members.'@odata.id' + "/Actions/ComputerSystem.Reset"

    Write-Output $Uri

    Invoke-RestMethod @PSBoundParameters -Uri $Uri -Body $($Payload | ConvertTo-Json) -Method Post
    
    
}