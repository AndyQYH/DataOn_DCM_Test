Describe "Get-DataONSystemPower tests" {

    Context 'With Credential Tests' {
        It "Should return at least 1 Power Supply" {
            (Get-DataONSystemPower -ComputerName $ComputerName -Credential $Credential -SkipCertificateCheck).PowerSupplies.Count -gt 0 | Should Be $true
        }
    }

    Context 'With WebSession Tests' {
        It "Should return at least 1 Power Supply" {
            (Get-DataONSystemPower -ComputerName $ComputerName -WebSession $WebSession -SkipCertificateCheck).PowerSupplies.Count -gt 0 | Should Be $true
        }
    }
}