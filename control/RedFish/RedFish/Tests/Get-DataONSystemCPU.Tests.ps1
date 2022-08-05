Describe "Get-DataONSystemCPU tests" {

    Context 'With Credential Tests' {
        It "Should have CPU" {
            (Get-DataONSystemCPU -ComputerName $ComputerName -Credential $Credential -SkipCertificateCheck)[0].TotalCores -gt 0 | Should Be $true
        }
    }

    Context 'With WebSession Tests' {
        It "Should have CPU" {
            (Get-DataONSystemCPU -ComputerName $ComputerName -WebSession $WebSession -SkipCertificateCheck)[0].TotalCores -gt 0 | Should Be $true
        }
    }
}