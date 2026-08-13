# EV Charging Platform Setup Script

Write-Host "🚀 EV Charging Platform Setup" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Frontend setup
Write-Host "`n🌐 Installing frontend dependencies..." -ForegroundColor Cyan
Set-Location "c:\Users\Akhter Laptops\Desktop\vs-charging\ev-charge-web"
npm install --legacy-peer-deps

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend dependencies installed successfully!" -ForegroundColor Green
    Write-Host "`n🎉 Setup completed!" -ForegroundColor Green
    Write-Host "To start the frontend app:" -ForegroundColor Yellow
    Write-Host "cd 'c:\Users\Akhter Laptops\Desktop\vs-charging\ev-charge-web'; npm run dev" -ForegroundColor White
} else {
    Write-Host "❌ Frontend install error. Please run: npm install --legacy-peer-deps" -ForegroundColor Red
}
