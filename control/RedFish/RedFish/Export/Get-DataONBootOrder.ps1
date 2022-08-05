<#
.Synopsis
   Get the status of DataON System Boot Order
.DESCRIPTION
   Get the status of DataON System Boot Order, outputed in JSON format
.EXAMPLE
   Get-DataONIndication -WebSession $WebSession -ComputerName $ComputerName -SkipCertificateCheck
.EXAMPLE
   Get-DataONIndication -ComputerName $ComputerName -Credential 'admin' -SkipCertificateCheck

#>
function Get-DataONBootOrder {
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

    $system = Invoke-RestMethod @PSBoundParameters -Uri $Uri

    $Uri = "https://" + $ComputerName + $system.Members.'@odata.id'

    $Boot = Invoke-RestMethod @PSBoundParameters -Uri $Uri | Select-Object Boot

    $BootOrder = $Boot.Boot.'BootOrder'

    For($i=0;$i -lt $BootOrder.count; $i++){

   	 ($i+1).ToString() +": " + $BootOrder[$i]
    }
    
}