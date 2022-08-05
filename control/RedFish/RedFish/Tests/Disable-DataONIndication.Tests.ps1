Describe "Disable-DataONIndication tests" {

    Context 'With Credential Tests' {
        It "Should return Off" {
            Disable-DataONIndication -ComputerName $ComputerName -Credential $Credential -SkipCertificateCheck
            (Get-DataONIndication -ComputerName $ComputerName -Credential $Credential -SkipCertificateCheck).IndicatorLED -eq 'Off' | Should Be $true
        }
    }

    Context 'With WebSession Tests' {
        It "Should return Off" {
            Disable-DataONIndication -ComputerName $ComputerName -WebSession $WebSession -SkipCertificateCheck
            (Get-DataONIndication -ComputerName $ComputerName -WebSession $WebSession -SkipCertificateCheck).IndicatorLED -eq 'Off' | Should Be $true
        }
    }
}