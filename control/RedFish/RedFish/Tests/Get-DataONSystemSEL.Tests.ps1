Describe "Get-DataONSystemSEL tests" {

    Context 'With Credential Tests' {
        It "Should return at least 1 SEL" {
            (Get-DataONSystemSEL -ComputerName $ComputerName -Credential $Credential -SkipCertificateCheck).Count -gt 0 | Should Be $true
        }
    }

    Context 'With WebSession Tests' {
        It "Should return at least 1 SEL" {
            (Get-DataONSystemSEL -ComputerName $ComputerName -WebSession $WebSession -SkipCertificateCheck).Count -gt 0 | Should Be $true
        }
    }
}