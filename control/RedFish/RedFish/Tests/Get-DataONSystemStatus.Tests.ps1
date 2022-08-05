Describe "Get-DataONSystemStatus tests" {

    Context 'With Credential Tests' {
        It "Should return On or Off" {
            (Get-DataONSystemStatus -ComputerName $ComputerName -Credential $Credential -SkipCertificateCheck).PowerState -eq 'On' -Or 'Off' | Should Be $true
        }
    }

    Context 'With WebSession Tests' {
        It "Should return On or Off" {
            (Get-DataONSystemStatus -ComputerName $ComputerName -WebSession $WebSession -SkipCertificateCheck).PowerState -eq 'On' -Or 'Off' | Should Be $true
        }
    }
}