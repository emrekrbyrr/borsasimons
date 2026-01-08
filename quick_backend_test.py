#!/usr/bin/env python3
"""
Quick Backend Test - Focus on key requirements
"""

import requests
import json
from datetime import datetime

def test_key_features():
    base_url = "https://patternfinder-3.preview.emergentagent.com/api"
    
    # Test credentials
    test_email = f"test_{datetime.now().strftime('%H%M%S')}@test.com"
    test_password = "TestPass123!"
    
    print("🔍 Testing Key BIST Platform Features")
    print("=" * 50)
    
    # 1. Register and login
    try:
        # Register
        reg_data = {
            "email": test_email,
            "password": test_password,
            "full_name": "Test User"
        }
        reg_response = requests.post(f"{base_url}/auth/register", json=reg_data, timeout=10)
        
        if reg_response.status_code == 200:
            token = reg_response.json()['access_token']
            headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
            print("✅ Authentication successful")
            
            # 2. Test symbols list
            symbols_response = requests.get(f"{base_url}/stocks/symbols", headers=headers, timeout=10)
            
            if symbols_response.status_code == 200:
                symbols_data = symbols_response.json()
                symbols = symbols_data.get('symbols', [])
                symbol_count = len(symbols)
                
                print(f"✅ Retrieved {symbol_count} symbols")
                
                # Check for TGSAS and DESPC
                required_stocks = ['TGSAS', 'DESPC']
                found_stocks = []
                missing_stocks = []
                
                for stock in required_stocks:
                    if stock in symbols:
                        found_stocks.append(stock)
                    else:
                        missing_stocks.append(stock)
                
                if found_stocks:
                    print(f"✅ Found required stocks: {found_stocks}")
                if missing_stocks:
                    print(f"❌ Missing stocks: {missing_stocks}")
                
                # Check if expanded beyond 100
                if symbol_count > 100:
                    print(f"✅ Stock list expanded: {symbol_count} symbols (>100)")
                else:
                    print(f"❌ Stock list not expanded: only {symbol_count} symbols")
                    
            else:
                print(f"❌ Failed to get symbols: {symbols_response.status_code}")
            
            # 3. Test partial match endpoint
            try:
                partial_data = {
                    "symbol": "AKBNK",
                    "start_date": "2024-01-01",
                    "end_date": "2024-06-30",
                    "min_similarity": 0.6,
                    "pattern_start_percent": 30,
                    "limit": 5
                }
                
                partial_response = requests.post(
                    f"{base_url}/stocks/find-partial-match", 
                    json=partial_data, 
                    headers=headers, 
                    timeout=15
                )
                
                if partial_response.status_code == 200:
                    partial_results = partial_response.json()
                    print(f"✅ Partial match endpoint working: {len(partial_results)} results")
                    
                    # Check for partial match indicators
                    has_partial_type = any(r.get('match_type') == 'partial' for r in partial_results)
                    if has_partial_type:
                        print("✅ Partial match results have correct match_type")
                    else:
                        print("⚠️  Partial match results missing match_type indicators")
                        
                else:
                    print(f"❌ Partial match endpoint failed: {partial_response.status_code}")
                    
            except Exception as e:
                print(f"❌ Partial match test failed: {str(e)}")
                
        else:
            print(f"❌ Registration failed: {reg_response.status_code}")
            
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")

if __name__ == "__main__":
    test_key_features()