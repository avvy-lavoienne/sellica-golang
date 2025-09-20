param(
    [int]$ConcurrentUsers = 10,
    [int]$TestDurationMinutes = 5
)

Write-Host "Production Load Test" -ForegroundColor Green
Write-Host "Concurrent Users: $ConcurrentUsers"
Write-Host "Duration: $TestDurationMinutes minutes"
Write-Host "=" * 50

$startTime = Get-Date
$endTime = $startTime.AddMinutes($TestDurationMinutes)
$totalRequests = 0
$successfulRequests = 0
$errors = 0

# Test queries for birth certificate scenarios
$testQueries = @(
    "syarat akta kelahiran",
    "berapa lama proses akta kelahiran",
    "dokumen untuk akta kelahiran terlambat",
    "biaya akta kelahiran",
    "akta kelahiran online"
)

# Run concurrent load test
$jobs = @()
for ($i = 1; $i -le $ConcurrentUsers; $i++) {
    $jobs += Start-Job -ScriptBlock {
        param($userId, $queries, $endTime)
        $userRequests = 0
        $userSuccess = 0

        while ((Get-Date) -lt $endTime) {
            $query = $queries | Get-Random
            try {
                $response = Invoke-RestMethod -Uri "http://localhost:8080/api/chat" -Method POST -Body (@{message=$query; userId=$userId} | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 30

                $userRequests++
                if ($response.success) {
                    $userSuccess++
                }
            } catch {
                # Error occurred
            }

            # Random delay between requests (1-5 seconds)
            Start-Sleep -Seconds (Get-Random -Minimum 1 -Maximum 5)
        }

        return @{Requests=$userRequests; Success=$userSuccess}
    } -ArgumentList $i, $testQueries, $endTime
}

# Monitor progress
while ((Get-Date) -lt $endTime) {
    $completed = $jobs | Where-Object { $_.State -eq "Completed" } | Measure-Object | Select-Object -ExpandProperty Count
    Write-Progress -Activity "Load Test Progress" -Status "Users: $completed / $ConcurrentUsers" -PercentComplete (($completed / $ConcurrentUsers) * 100)
    Start-Sleep -Seconds 5
}

# Collect results
$results = $jobs | Receive-Job
$totalRequests = ($results | Measure-Object -Property Requests -Sum).Sum
$successfulRequests = ($results | Measure-Object -Property Success -Sum).Sum

Write-Host "`nLoad Test Results" -ForegroundColor Cyan
Write-Host "Total Requests: $totalRequests"
Write-Host "Successful Requests: $successfulRequests"
Write-Host "Success Rate: $([math]::Round(($successfulRequests / $totalRequests) * 100, 1))%"
Write-Host "Average RPS: $([math]::Round($totalRequests / ($TestDurationMinutes * 60), 1))"

if (($successfulRequests / $totalRequests) -gt 0.95) {
    Write-Host "Load Test: PASSED" -ForegroundColor Green
} else {
    Write-Host "Load Test: FAILED" -ForegroundColor Red
}