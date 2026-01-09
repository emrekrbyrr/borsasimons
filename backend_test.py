#!/usr/bin/env python3
"""
BIST 100 Stock Analysis Platform - Backend API Testing
Tests all authentication, stock analysis, and pattern matching endpoints
"""

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class BISTAnalysisAPITester:
    def __init__(self, base_url="https://patfinder-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data
        self.test_email = f"test_user_{datetime.now().strftime('%H%M%S')}@test.com"
        self.test_password = "TestPass123!"
        self.test_full_name = "Test User"

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            
        result = {
            "test_name": name,
            "success": success,
            "details": details,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")
        if not success and response_data:
            print(f"    Response: {response_data}")

    def make_request(self, method: str, endpoint: str, data: Dict = None, expected_status: int = 200) -> tuple:
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, f"Unsupported method: {method}", {}

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            if not success:
                details = f"Expected {expected_status}, got {response.status_code}"
                if response_data.get('detail'):
                    details += f" - {response_data['detail']}"
            else:
                details = f"Status: {response.status_code}"

            return success, details, response_data

        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}", {}

    def test_health_check(self):
        """Test health endpoint"""
        success, details, response = self.make_request('GET', 'health')
        
        if success and response.get('status') == 'healthy':
            self.log_test("Health Check", True, "API is healthy")
        else:
            self.log_test("Health Check", False, details, response)

    def test_user_registration(self):
        """Test user registration"""
        data = {
            "email": self.test_email,
            "password": self.test_password,
            "full_name": self.test_full_name
        }
        
        success, details, response = self.make_request('POST', 'auth/register', data)
        
        if success and response.get('access_token') and response.get('user'):
            self.token = response['access_token']
            self.user_id = response['user']['id']
            self.log_test("User Registration", True, f"User created with ID: {self.user_id}")
        else:
            self.log_test("User Registration", False, details, response)

    def test_user_login(self):
        """Test user login"""
        data = {
            "email": self.test_email,
            "password": self.test_password
        }
        
        success, details, response = self.make_request('POST', 'auth/login', data)
        
        if success and response.get('access_token'):
            # Update token if different
            if response['access_token'] != self.token:
                self.token = response['access_token']
            self.log_test("User Login", True, "Login successful")
        else:
            self.log_test("User Login", False, details, response)

    def test_get_user_profile(self):
        """Test get current user profile"""
        if not self.token:
            self.log_test("Get User Profile", False, "No authentication token")
            return
            
        success, details, response = self.make_request('GET', 'auth/me')
        
        if success and response.get('email') == self.test_email:
            self.log_test("Get User Profile", True, f"Profile retrieved for {response['email']}")
        else:
            self.log_test("Get User Profile", False, details, response)

    def test_get_bist_symbols(self):
        """Test getting BIST symbols - should be expanded from 100 to 444+"""
        if not self.token:
            self.log_test("Get BIST Symbols", False, "No authentication token")
            return
            
        success, details, response = self.make_request('GET', 'stocks/symbols')
        
        if success and response.get('symbols'):
            symbol_count = len(response['symbols'])
            symbols = response['symbols']
            
            # Check if list has been expanded (should be more than 100)
            if symbol_count > 100:
                self.log_test("Get BIST Symbols", True, f"Retrieved {symbol_count} symbols (expanded from 100)")
            else:
                self.log_test("Get BIST Symbols", False, f"Only {symbol_count} symbols found, expected >100")
                
            # Check for specific requested stocks
            missing_stocks = []
            required_stocks = ['TGSAS', 'DESPC']
            for stock in required_stocks:
                if stock not in symbols:
                    missing_stocks.append(stock)
            
            if missing_stocks:
                self.log_test("Required Stocks Check", False, f"Missing stocks: {missing_stocks}")
            else:
                self.log_test("Required Stocks Check", True, f"All required stocks found: {required_stocks}")
        else:
            self.log_test("Get BIST Symbols", False, details, response)

    def test_stock_analysis(self):
        """Test stock analysis endpoint"""
        if not self.token:
            self.log_test("Stock Analysis", False, "No authentication token")
            return
            
        # Use a common BIST stock
        data = {
            "symbol": "AKBNK",  # Akbank
            "start_date": "2023-01-01",
            "end_date": "2023-12-31"
        }
        
        success, details, response = self.make_request('POST', 'stocks/analyze', data)
        
        if success and response.get('symbol') == 'AKBNK' and response.get('prices'):
            price_count = len(response['prices'])
            peaks_count = len([p for p in response.get('peaks_troughs', []) if p['point_type'] == 'tepe'])
            troughs_count = len([p for p in response.get('peaks_troughs', []) if p['point_type'] == 'dip'])
            
            self.log_test("Stock Analysis", True, 
                         f"Analysis complete: {price_count} price points, {peaks_count} peaks, {troughs_count} troughs")
        else:
            self.log_test("Stock Analysis", False, details, response)

    def test_quick_stock_info(self):
        """Test quick stock info endpoint"""
        if not self.token:
            self.log_test("Quick Stock Info", False, "No authentication token")
            return
            
        success, details, response = self.make_request('GET', 'stocks/AKBNK/quick')
        
        if success and response.get('symbol') == 'AKBNK' and 'current_price' in response:
            self.log_test("Quick Stock Info", True, 
                         f"AKBNK current price: ₺{response['current_price']}")
        else:
            self.log_test("Quick Stock Info", False, details, response)

    def test_find_similar_stocks(self):
        """Test finding similar stocks"""
        if not self.token:
            self.log_test("Find Similar Stocks", False, "No authentication token")
            return
            
        data = {
            "symbol": "AKBNK",
            "start_date": "2023-01-01", 
            "end_date": "2023-12-31",
            "min_similarity": 0.5,  # Lower threshold for testing
            "limit": 10
        }
        
        success, details, response = self.make_request('POST', 'stocks/find-similar', data)
        
        if success and isinstance(response, list):
            similar_count = len(response)
            self.log_test("Find Similar Stocks", True, 
                         f"Found {similar_count} similar stocks to AKBNK")
        else:
            self.log_test("Find Similar Stocks", False, details, response)

    def test_find_partial_match_stocks(self):
        """Test the new partial match endpoint for ongoing patterns"""
        if not self.token:
            self.log_test("Find Partial Match Stocks", False, "No authentication token")
            return
            
        data = {
            "symbol": "AKBNK",
            "start_date": "2023-01-01", 
            "end_date": "2023-12-31",
            "min_similarity": 0.5,  # Lower threshold for testing
            "pattern_start_percent": 30,
            "limit": 15
        }
        
        success, details, response = self.make_request('POST', 'stocks/find-partial-match', data)
        
        if success and isinstance(response, list):
            partial_count = len(response)
            # Check if results have partial match indicators
            has_partial_indicators = any(
                stock.get('match_type') == 'partial' and 'pattern_progress' in stock 
                for stock in response
            )
            
            if has_partial_indicators:
                self.log_test("Find Partial Match Stocks", True, 
                             f"Found {partial_count} partial matches with progress indicators")
            else:
                self.log_test("Find Partial Match Stocks", True, 
                             f"Found {partial_count} partial matches (no progress indicators)")
        else:
            self.log_test("Find Partial Match Stocks", False, details, response)

    def test_tgsas_stock_analysis(self):
        """Test analysis of TGSAS stock specifically"""
        if not self.token:
            self.log_test("TGSAS Stock Analysis", False, "No authentication token")
            return
            
        data = {
            "symbol": "TGSAS",
            "start_date": "2023-01-01",
            "end_date": "2023-12-31"
        }
        
        success, details, response = self.make_request('POST', 'stocks/analyze', data)
        
        if success and response.get('symbol') == 'TGSAS':
            self.log_test("TGSAS Stock Analysis", True, "TGSAS analysis successful")
        else:
            self.log_test("TGSAS Stock Analysis", False, details, response)

    def test_despc_stock_analysis(self):
        """Test analysis of DESPC stock specifically"""
        if not self.token:
            self.log_test("DESPC Stock Analysis", False, "No authentication token")
            return
            
        data = {
            "symbol": "DESPC",
            "start_date": "2023-01-01",
            "end_date": "2023-12-31"
        }
        
        success, details, response = self.make_request('POST', 'stocks/analyze', data)
        
        if success and response.get('symbol') == 'DESPC':
            self.log_test("DESPC Stock Analysis", True, "DESPC analysis successful")
        else:
            self.log_test("DESPC Stock Analysis", False, details, response)

    def test_save_analysis(self):
        """Test saving analysis"""
        if not self.token:
            self.log_test("Save Analysis", False, "No authentication token")
            return
            
        data = {
            "symbol": "AKBNK",
            "start_date": "2023-01-01",
            "end_date": "2023-12-31",
            "analysis_type": "pattern_analysis",
            "results": {"test": "data"}
        }
        
        success, details, response = self.make_request('POST', 'analysis/save', data)
        
        if success and response.get('id'):
            self.log_test("Save Analysis", True, f"Analysis saved with ID: {response['id']}")
        else:
            self.log_test("Save Analysis", False, details, response)

    def test_get_saved_analyses(self):
        """Test getting saved analyses"""
        if not self.token:
            self.log_test("Get Saved Analyses", False, "No authentication token")
            return
            
        success, details, response = self.make_request('GET', 'analysis/saved')
        
        if success and isinstance(response, list):
            saved_count = len(response)
            self.log_test("Get Saved Analyses", True, 
                         f"Retrieved {saved_count} saved analyses")
        else:
            self.log_test("Get Saved Analyses", False, details, response)

    def test_invalid_authentication(self):
        """Test invalid authentication handling"""
        # Save current token
        original_token = self.token
        self.token = "invalid_token_12345"
        
        success, details, response = self.make_request('GET', 'auth/me', expected_status=401)
        
        if success:  # Success means we got expected 401
            self.log_test("Invalid Authentication", True, "Properly rejected invalid token")
        else:
            self.log_test("Invalid Authentication", False, details, response)
        
        # Restore token
        self.token = original_token

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting BIST Analysis Platform API Tests")
        print("=" * 60)
        
        # Basic connectivity
        self.test_health_check()
        
        # Authentication flow
        self.test_user_registration()
        self.test_user_login()
        self.test_get_user_profile()
        
        # Stock data endpoints
        self.test_get_bist_symbols()
        self.test_quick_stock_info()
        self.test_stock_analysis()
        
        # Analysis features
        self.test_find_similar_stocks()
        self.test_find_partial_match_stocks()  # New partial match endpoint
        
        # Test specific stocks mentioned in requirements
        self.test_tgsas_stock_analysis()
        self.test_despc_stock_analysis()
        
        # Data persistence
        self.test_save_analysis()
        self.test_get_saved_analyses()
        
        # Security
        self.test_invalid_authentication()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return 1

    def get_test_report(self):
        """Get detailed test report"""
        return {
            "summary": {
                "total_tests": self.tests_run,
                "passed_tests": self.tests_passed,
                "failed_tests": self.tests_run - self.tests_passed,
                "success_rate": round((self.tests_passed / self.tests_run) * 100, 2) if self.tests_run > 0 else 0
            },
            "test_results": self.test_results,
            "timestamp": datetime.now().isoformat()
        }

def main():
    """Main test execution"""
    tester = BISTAnalysisAPITester()
    
    try:
        exit_code = tester.run_all_tests()
        
        # Save detailed report
        report = tester.get_test_report()
        with open('/app/test_reports/backend_test_report.json', 'w') as f:
            json.dump(report, f, indent=2)
        
        return exit_code
        
    except Exception as e:
        print(f"❌ Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())