Describe "New-DataONSession tests" {

    Context 'With Credential Tests' {
        It "Should return WebRequest" {
            (New-DataONSession -ComputerName $ComputerName -Credential $Credential -SkipCertificateCheck).GetType().Name -eq 'WebRequestSession' | Should Be $true
        }
    }

}