Describe "Get-DataONIndication tests" {

    Context 'With Credential Tests' {
        It "Should return Off or Blinking" {
            (Get-DataONIndication -ComputerName $ComputerName -Credential $Credential -SkipCertificateCheck).IndicatorLED -eq 'Off' -Or 'Blinking' | Should Be $true
        }
    }

    Context 'With WebSession Tests' {
        It "Should return Off or Blinking" {
            (Get-DataONIndication -ComputerName $ComputerName -WebSession $WebSession -SkipCertificateCheck).IndicatorLED -eq 'Off' -Or 'Blinking' | Should Be $true
        }
    }
}