<#
.Synopsis
   Turn on DataON System Indicatior LED
.DESCRIPTION
   Turn on DataON System Indicatior LED. The result will be 'Blinking'
.EXAMPLE
   Set-DataONBootOrderPXE -WebSession $WebSession -ComputerName $ComputerName -SkipCertificateCheck
.EXAMPLE
   Set-DataONBootOrderPXE -ComputerName $ComputerName -Credential 'admin' -SkipCertificateCheck

#>
function Set-DataONBootOrderPXE {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory)]
        [ValidateNotNullOrEmpty()]
        [String] $ComputerName,
        [PSCredential] $Credential,
        [Microsoft.PowerShell.Commands.WebRequestSession] $WebSession,
        [switch] $SkipCertificateCheck
    )
    
    #Assume We want to use PXE boot for next boot cycle
    #Allow Boot Source Override and set the target to "PXE"
    #Patch the JSON to the server to apply changes; might need to refresh browser
  
    $BootOptions = @{"BootSourceOverrideEnabled" = "Once";"BootSourceOverrideTarget" = "Pxe";}
    $Payload = @{}
    $Payload.Add("Boot",$BootOptions)
    $Payload | ConvertTo-Json

    $Uri = "https://" + $ComputerName + "/redfish/v1/Systems"

    $PSBoundParameters.Remove('ComputerName') | Out-Null

    $system =  Invoke-RestMethod @PSBoundParameters -Uri $Uri

    $Uri = "https://" + $ComputerName + $system.Members.'@odata.id'

    $Uri | ConvertTo-Json

    Invoke-RestMethod @PSBoundParameters -Uri $Uri -Body $($Payload | ConvertTo-Json) -Method Patch

    $System = Invoke-RestMethod @PSBoundParameters -Uri $Uri
    $PowerState = $System.PowerState
    $PowerState

    while($PowerState -ne "On" -and $PowerState -ne "Off"){
      Write-Host "Loading System Power Status ..."
      $System = Invoke-RestMethod @PSBoundParameters -Uri $Uri
      $PowerState = $System.PowerState
    }
    

    $Uri = $Uri + "/Actions/ComputerSystem.Reset" 

    $Uri

    #Check the power state of the server
    #If ON, powers off and restart
    #If OFF, powers on

    if ($PowerState -eq "On")
    {
        Write-Host "Force Restarting Server ..."
	     $Payload = @{"ResetType" = "ForceRestart";}
        Invoke-RestMethod @PSBoundParameters -Uri $Uri -Body $($Payload | ConvertTo-Json) -Method Post
    }
    else
    {
        Write-Host "Starting Server ..."
        $Payload = @{"ResetType" = "On";}
        Invoke-RestMethod @PSBoundParameters -Uri $Uri -Body $($Payload | ConvertTo-Json) -Method Post

    }

    
}