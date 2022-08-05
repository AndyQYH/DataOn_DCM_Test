Describe "Set-DataONSystemAction tests" {

    Context 'With WebSession PowerOff Tests' {
        It "Should return Off" {
            Set-DataONSystemAction -ComputerName $ComputerName -WebSession $WebSession -Action ForceOff -SkipCertificateCheck
            Start-Sleep -Seconds 60
            (Get-DataONSystemStatus -ComputerName $ComputerName -WebSession $WebSession -SkipCertificateCheck).PowerState -eq 'Off' | Should Be $true
        }
    }

    Context 'With WebSession Power On Tests' {
        It "Should return On" {
            Set-DataONSystemAction -ComputerName $ComputerName -WebSession $WebSession -Action ForceOn -SkipCertificateCheck
            Start-Sleep -Seconds 60
            (Get-DataONSystemStatus -ComputerName $ComputerName -WebSession $WebSession -SkipCertificateCheck).PowerState -eq 'On' | Should Be $true
        }
    }
}