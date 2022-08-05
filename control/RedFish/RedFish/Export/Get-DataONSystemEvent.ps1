function Get-DataONSystemEvent {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory)]
        [ValidateNotNullOrEmpty()]
        [String] $ComputerName,
        [PSCredential] $Credential,
        [Microsoft.PowerShell.Commands.WebRequestSession] $WebSession,
        [switch] $SkipCertificateCheck
    )
    
 
    $Base = "https://" + $ComputerName 

    $Uri = $Base + "/redfish/v1/EventService/Subscriptions"

    $PSBoundParameters.Remove('ComputerName') | Out-Null

    #Write-Output $Uri

    $result = Invoke-RestMethod @PSBoundParameters -Uri $Uri 

    #Write-Output $result.Members


    for($i = 0; $i -lt $result.'Members@odata.count';$i++)
    {
        $uri = $Base + $result.Members[$i].'@odata.id'
        Invoke-RestMethod @PSBoundParameters -Uri $Uri 
    }
    
    
}