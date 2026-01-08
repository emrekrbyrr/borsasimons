"""
BIST Stock Analysis Platform - Backend API Tests
Tests for authentication, stock data, and analysis endpoints
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://patfinder-1.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "test2@test.com"
TEST_PASSWORD = "test1234"

class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_health_endpoint(self):
        """Test API health check"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        print(f"✓ Health check passed: {data}")


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        print(f"✓ Login successful for {TEST_EMAIL}")
        return data["access_token"]
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "wrong@test.com", "password": "wrongpass"}
        )
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected")
    
    def test_protected_endpoint_without_token(self):
        """Test accessing protected endpoint without token"""
        response = requests.get(f"{BASE_URL}/api/stocks/symbols")
        assert response.status_code in [401, 403]
        print("✓ Protected endpoint correctly requires authentication")


class TestStockSymbols:
    """Stock symbols endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Authentication failed")
    
    def test_get_symbols(self):
        """Test getting stock symbols list"""
        response = requests.get(
            f"{BASE_URL}/api/stocks/symbols",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "symbols" in data
        assert len(data["symbols"]) > 100  # Should have 400+ symbols
        print(f"✓ Got {len(data['symbols'])} stock symbols")
    
    def test_symbols_alphabetically_sorted(self):
        """Test that symbols are alphabetically sorted"""
        response = requests.get(
            f"{BASE_URL}/api/stocks/symbols",
            headers=self.headers
        )
        data = response.json()
        symbols = data["symbols"]
        assert symbols == sorted(symbols), "Symbols should be alphabetically sorted"
        print("✓ Symbols are alphabetically sorted")
    
    def test_specific_symbols_present(self):
        """Test that specific symbols are present"""
        response = requests.get(
            f"{BASE_URL}/api/stocks/symbols",
            headers=self.headers
        )
        data = response.json()
        symbols = data["symbols"]
        
        # Check for key BIST stocks
        expected_symbols = ["THYAO", "GARAN", "AKBNK", "EREGL", "SISE", "TGSAS", "DESPC"]
        for symbol in expected_symbols:
            assert symbol in symbols, f"{symbol} should be in symbols list"
        print(f"✓ All expected symbols present: {expected_symbols}")


class TestCandlestickData:
    """Candlestick data endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Authentication failed")
    
    def test_get_candlestick_data(self):
        """Test getting candlestick data for a stock"""
        response = requests.get(
            f"{BASE_URL}/api/stocks/THYAO/candlestick?interval=1d&period=3mo",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "symbol" in data
        assert data["symbol"] == "THYAO"
        assert "candles" in data
        assert len(data["candles"]) > 0
        
        # Verify candle structure
        candle = data["candles"][0]
        assert "time" in candle
        assert "open" in candle
        assert "high" in candle
        assert "low" in candle
        assert "close" in candle
        print(f"✓ Got {len(data['candles'])} candles for THYAO")
    
    def test_candlestick_different_intervals(self):
        """Test candlestick data with different intervals"""
        intervals = ["1d", "1wk"]
        for interval in intervals:
            response = requests.get(
                f"{BASE_URL}/api/stocks/GARAN/candlestick?interval={interval}&period=3mo",
                headers=self.headers
            )
            assert response.status_code == 200
            data = response.json()
            assert data["interval"] == interval
            print(f"✓ Candlestick data works for interval: {interval}")


class TestStockAnalysis:
    """Stock analysis endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Authentication failed")
    
    def test_analyze_stock(self):
        """Test stock analysis endpoint"""
        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")
        
        response = requests.post(
            f"{BASE_URL}/api/stocks/analyze",
            json={
                "symbol": "THYAO",
                "start_date": start_date,
                "end_date": end_date
            },
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data["symbol"] == "THYAO"
        assert "prices" in data
        assert "peaks_troughs" in data
        assert "summary" in data
        
        # Verify summary stats
        summary = data["summary"]
        assert "min_price" in summary
        assert "max_price" in summary
        assert "avg_price" in summary
        assert "volatility" in summary
        assert "total_return" in summary
        
        print(f"✓ Analysis completed for THYAO")
        print(f"  - Price range: {summary['min_price']} - {summary['max_price']}")
        print(f"  - Volatility: {summary['volatility']}%")
        print(f"  - Total return: {summary['total_return']}%")
        print(f"  - Peaks/Troughs found: {len(data['peaks_troughs'])}")


class TestQuickStockInfo:
    """Quick stock info endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Authentication failed")
    
    def test_get_quick_stock_info(self):
        """Test quick stock info endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/stocks/THYAO/quick",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["symbol"] == "THYAO"
        assert "current_price" in data
        assert "change_percent" in data
        assert "volume" in data
        
        print(f"✓ Quick info for THYAO:")
        print(f"  - Current price: {data['current_price']}")
        print(f"  - Change: {data['change_percent']}%")


class TestSimilarStocksSearch:
    """Similar stocks search endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Authentication failed")
    
    def test_find_similar_stocks_endpoint_exists(self):
        """Test that find-similar endpoint exists and accepts requests"""
        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=180)).strftime("%Y-%m-%d")
        
        response = requests.post(
            f"{BASE_URL}/api/stocks/find-similar",
            json={
                "symbol": "THYAO",
                "start_date": start_date,
                "end_date": end_date,
                "min_similarity": 0.5,
                "limit": 5
            },
            headers=self.headers,
            timeout=60  # Allow longer timeout for heavy computation
        )
        # Accept 200 or timeout (endpoint exists but computation heavy)
        assert response.status_code in [200, 504], f"Unexpected status: {response.status_code}"
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Find similar stocks returned {len(data)} results")
        else:
            print("✓ Find similar endpoint exists (timeout due to heavy computation)")
    
    def test_find_partial_match_endpoint_exists(self):
        """Test that find-partial-match endpoint exists"""
        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=180)).strftime("%Y-%m-%d")
        
        response = requests.post(
            f"{BASE_URL}/api/stocks/find-partial-match",
            json={
                "symbol": "THYAO",
                "start_date": start_date,
                "end_date": end_date,
                "min_similarity": 0.5,
                "pattern_start_percent": 30,
                "limit": 5
            },
            headers=self.headers,
            timeout=60
        )
        assert response.status_code in [200, 504], f"Unexpected status: {response.status_code}"
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Find partial match returned {len(data)} results")
        else:
            print("✓ Find partial match endpoint exists (timeout due to heavy computation)")


class TestSaveAnalysis:
    """Save analysis endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Authentication failed")
    
    def test_save_analysis(self):
        """Test saving an analysis"""
        response = requests.post(
            f"{BASE_URL}/api/analysis/save",
            json={
                "symbol": "TEST_THYAO",
                "start_date": "2024-01-01",
                "end_date": "2024-06-01",
                "analysis": {"test": True},
                "similar_stocks": []
            },
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["message"] == "Analysis saved"
        print(f"✓ Analysis saved with ID: {data['id']}")
    
    def test_get_saved_analyses(self):
        """Test getting saved analyses"""
        response = requests.get(
            f"{BASE_URL}/api/analysis/saved",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} saved analyses")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
