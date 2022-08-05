function Set-DataONSystemEvent {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory)]
        [ValidateNotNullOrEmpty()]
        [String] $ComputerName,
        [PSCredential] $Credential,
        [Microsoft.PowerShell.Commands.WebRequestSession] $WebSession,
        [switch] $SkipCertificateCheck
    )
    
    $a = ,"Alert"
 
    $Payload = @{"Destination"= "https://10.4.7.27"; "EventTypes"  = $a; "Context" = "Public"; "Protocol" = "Redfish"}

    $Uri = "https://" + $ComputerName + "/redfish/v1/EventService/Subscriptions"

    $PSBoundParameters.Remove('ComputerName') | Out-Null

    Write-Output $Uri

    Invoke-RestMethod @PSBoundParameters -Uri $Uri -Body $($Payload | ConvertTo-Json) -Method Post
    
    
}