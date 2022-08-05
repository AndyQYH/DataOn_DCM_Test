function Test-DataONSystemEvent {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory)]
        [ValidateNotNullOrEmpty()]
        [String] $ComputerName,
        [PSCredential] $Credential,
        [Microsoft.PowerShell.Commands.WebRequestSession] $WebSession,

        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [ValidateSet('Info', 'Warning')]
        [String]$Severity,

        [switch] $SkipCertificateCheck
    )
    
    $a = "56", "67"
 
    $Payload = @{"EventType" = "Alert"; "EventId" = "1"; "EventTimestamp" = "2020-02-06T16:25:46+00:00";"Severity" = "Warning";"Message" = "Testing"; "MessageId" = "1"; "MessageArgs" = $a;
    "OriginOfCondition"= "/redfish/v1/Systems/1/"}

    $Uri = "https://" + $ComputerName + "/redfish/v1/EventService/Actions/EventService.SubmitTestEvent"

    $PSBoundParameters.Remove('ComputerName') | Out-Null

    Write-Output $Uri

    Invoke-RestMethod @PSBoundParameters -Uri $Uri -Body $($Payload | ConvertTo-Json) -Method Post
    
    
}