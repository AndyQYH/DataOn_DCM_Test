Describe "Get-DataONSystemMetrics tests" {

    Context 'With Credential Tests' {
        It "Should return result" {
            (Get-DataONSystemMetrics -ComputerName $ComputerName -Credential $Credential -SkipCertificateCheck).Name -eq 'Computer System Metrics' | Should Be $true
        }
    }

    Context 'With WebSession Tests' {
        It "Should return result" {
            (Get-DataONSystemMetrics -ComputerName $ComputerName -WebSession $WebSession -SkipCertificateCheck).Name -eq 'Computer System Metrics' | Should Be $true
        }
    }
}