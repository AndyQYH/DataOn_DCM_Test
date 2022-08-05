Describe "Enable-DataONIndication tests" {

    Context 'With Credential Tests' {
        It "Should return Blinking" {
            Enable-DataONIndication -ComputerName $ComputerName -Credential $Credential -SkipCertificateCheck
            (Get-DataONIndication -ComputerName $ComputerName -Credential $Credential -SkipCertificateCheck).IndicatorLED -eq 'Blinking' | Should Be $true
        }
    }

    Context 'With WebSession Tests' {
        It "Should return Blinking" {
            Enable-DataONIndication -ComputerName $ComputerName -WebSession $WebSession -SkipCertificateCheck
            (Get-DataONIndication -ComputerName $ComputerName -WebSession $WebSession -SkipCertificateCheck).IndicatorLED -eq 'Blinking' | Should Be $true
        }
    }
}