Get-Childitem *.ps1 -path export,private -Recurse | ForEach-Object{
    . $_.FullName
}

Get-Childitem *.ps1 -path export -Recurse | ForEach-Object{
    Export-ModuleMember $_.BaseName
}
