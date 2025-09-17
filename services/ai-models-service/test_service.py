#!/usr/bin/env python3
"""
Test script for AI Models Service
"""

import requests
import json
import sys
from pathlib import Path

def test_health_endpoint(base_url="http://localhost:8000"):
    """Test the health endpoint"""
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            data = response.json()
            print("✅ Health check passed")
            print(f"   Service: {data.get('service')}")
            print(f"   Status: {data.get('status')}")
            print(f"   Models loaded: {data.get('models_loaded')}")
            print(f"   Available models: {data.get('available_models')}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_models_endpoint(base_url="http://localhost:8000"):
    """Test the models list endpoint"""
    try:
        response = requests.get(f"{base_url}/models")
        if response.status_code == 200:
            data = response.json()
            print("✅ Models endpoint passed")
            print(f"   Models: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"❌ Models endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Models endpoint error: {e}")
        return False

def test_root_endpoint(base_url="http://localhost:8000"):
    """Test the root endpoint"""
    try:
        response = requests.get(f"{base_url}/")
        if response.status_code == 200:
            data = response.json()
            print("✅ Root endpoint passed")
            print(f"   Message: {data.get('message')}")
            print(f"   Status: {data.get('status')}")
            return True
        else:
            print(f"❌ Root endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Root endpoint error: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing AI Models Service...")
    print("=" * 50)
    
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
    print(f"Testing service at: {base_url}")
    print()
    
    tests = [
        ("Health Check", test_health_endpoint),
        ("Models List", test_models_endpoint),
        ("Root Endpoint", test_root_endpoint),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"🔍 {test_name}...")
        if test_func(base_url):
            passed += 1
        print()
    
    print("=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! AI Models Service is working correctly.")
        return 0
    else:
        print("❌ Some tests failed. Check the service logs.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
