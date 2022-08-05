Describe "Get-DataONSystemMemory tests" {

    Context 'With Credential Tests' {
        It "Should have Memory" {
            (Get-DataONSystemMemory -ComputerName $ComputerName -Credential $Credential -SkipCertificateCheck)[0].CapacityMiB -gt 0 | Should Be $true
        }
    }

    Context 'With WebSession Tests' {
        It "Should have Memory" {
            (Get-DataONSystemMemory -ComputerName $ComputerName -WebSession $WebSession -SkipCertificateCheck)[0].CapacityMiB -gt 0 | Should Be $true
        }
    }
}