#!/usr/bin/env pwsh

Write-Host "========================================"
Write-Host "BudgetBuddy AI Insights - API Test Flow"
Write-Host "========================================"

# Health check
Write-Host "`n[1/5] Testing /health endpoint..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/health" -TimeoutSec 5
    Write-Host "✓ Health check PASSED" -ForegroundColor Green
} catch {
    Write-Host "✗ Health check FAILED: $_" -ForegroundColor Red
    exit 1
}

# Login
Write-Host "`n[2/5] Testing login endpoint..." -ForegroundColor Cyan
try {
    $body = @{ email = "test@example.com"; password = "password123" } | ConvertTo-Json
    $login = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
        -Method POST `
        -Body $body `
        -ContentType "application/json" `
        -TimeoutSec 5
    $token = $login.accessToken
    Write-Host "✓ Login PASSED" -ForegroundColor Green
    Write-Host "  Token: $($token.Substring(0,30))..."
} catch {
    Write-Host "✗ Login FAILED: $_" -ForegroundColor Red
    exit 1
}

# Request insights
Write-Host "`n[3/5] Testing POST /api/ai/insights..." -ForegroundColor Cyan
try {
    $headers = @{ "Authorization" = "Bearer $token" }
    $aiBody = @{ startDate = "2025-10-01"; endDate = "2025-10-31" } | ConvertTo-Json
    $aiPost = Invoke-RestMethod -Uri "http://localhost:3000/api/ai/insights" `
        -Method POST `
        -Headers $headers `
        -Body $aiBody `
        -ContentType "application/json" `
        -TimeoutSec 5
    Write-Host "✓ POST /api/ai/insights PASSED" -ForegroundColor Green
    Write-Host "  Status: $($aiPost.status)"
    Write-Host "  Message: $($aiPost.message)"
} catch {
    Write-Host "✗ POST /api/ai/insights FAILED: $_" -ForegroundColor Red
    exit 1
}

# Wait for processing
Write-Host "`n[4/5] Waiting 5 seconds for insight processing..." -ForegroundColor Cyan
Start-Sleep -Seconds 5
Write-Host "  Ready to fetch results..." -ForegroundColor Green

# Fetch insights
Write-Host "`n[5/5] Testing GET /api/ai/insights..." -ForegroundColor Cyan
try {
    $aiGet = Invoke-RestMethod -Uri "http://localhost:3000/api/ai/insights" `
        -Method GET `
        -Headers $headers `
        -TimeoutSec 5
    Write-Host "✓ GET /api/ai/insights PASSED" -ForegroundColor Green
    Write-Host "  Insights: $($aiGet.insights.Substring(0,60))..."
    Write-Host "  Suggestions: $($aiGet.suggestions.Count) items"
    Write-Host "  Flags: $($aiGet.flags.Count) items"
    Write-Host "  Generated: $($aiGet.generatedAt)"
} catch {
    Write-Host "✗ GET /api/ai/insights FAILED: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host '✓ All API tests PASSED!' -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
