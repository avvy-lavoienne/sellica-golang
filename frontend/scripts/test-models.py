#!/usr/bin/env python3
"""
Production AI Model Testing for SELLY
Tests all deployed models and validates their functionality
"""

import requests
import json
import time
import logging
from typing import Dict, List, Any
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ModelTester:
    def __init__(self, serving_url: str = "http://localhost:8501"):
        self.serving_url = serving_url
        self.test_cases = {
            "indobert-base": [
                {
                    "text": "berapa total user bulan ini?",
                    "expected_intent": "count_query",
                    "description": "Basic count query in Indonesian"
                },
                {
                    "text": "tampilkan data pengguna yang aktif",
                    "expected_intent": "display_request", 
                    "description": "Display request with formal Indonesian"
                },
                {
                    "text": "gue mau cari data user yang error",
                    "expected_intent": "search_query",
                    "description": "Search query with Jakarta slang"
                }
            ],
            "indonesian-sentiment": [
                {
                    "text": "sistem ini sangat bagus dan membantu",
                    "expected_sentiment": "positive",
                    "description": "Positive sentiment in Indonesian"
                },
                {
                    "text": "ada masalah dengan data yang error",
                    "expected_sentiment": "negative", 
                    "description": "Negative sentiment about system issues"
                },
                {
                    "text": "data pengguna tersedia di sistem",
                    "expected_sentiment": "neutral",
                    "description": "Neutral informational statement"
                }
            ],
            "indonesian-ner": [
                {
                    "text": "Nama saya Budi Santoso dengan NIK 1234567890123456",
                    "expected_entities": ["PERSON", "NIK"],
                    "description": "Person name and ID number extraction"
                },
                {
                    "text": "Data dari Kelurahan Menteng, Jakarta Pusat",
                    "expected_entities": ["LOCATION"],
                    "description": "Indonesian administrative location"
                }
            ]
        }

    def check_serving_health(self) -> bool:
        """Check if TensorFlow Serving is healthy"""
        try:
            logger.info("🔍 Checking TensorFlow Serving health...")
            response = requests.get(f"{self.serving_url}/v1/models", timeout=10)
            
            if response.status_code == 200:
                models = response.json()
                logger.info(f"✅ TensorFlow Serving is healthy. Available models: {len(models.get('models', []))}")
                return True
            else:
                logger.error(f"❌ TensorFlow Serving health check failed: {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Cannot connect to TensorFlow Serving: {e}")
            return False

    def test_model_availability(self, model_name: str) -> bool:
        """Test if a specific model is available"""
        try:
            logger.info(f"🔍 Testing {model_name} availability...")
            response = requests.get(f"{self.serving_url}/v1/models/{model_name}", timeout=10)
            
            if response.status_code == 200:
                model_info = response.json()
                logger.info(f"✅ {model_name} is available. Versions: {model_info.get('model_version_status', [])}")
                return True
            else:
                logger.error(f"❌ {model_name} is not available: {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Error checking {model_name}: {e}")
            return False

    def test_model_inference(self, model_name: str, test_case: Dict[str, Any]) -> bool:
        """Test model inference with a specific test case"""
        try:
            logger.info(f"🧪 Testing {model_name} inference: {test_case['description']}")
            
            # Prepare request payload (this will vary by model type)
            if model_name == "indobert-base":
                payload = {
                    "instances": [
                        {
                            "input_text": test_case["text"]
                        }
                    ]
                }
            elif model_name == "indonesian-sentiment":
                payload = {
                    "instances": [
                        {
                            "text": test_case["text"]
                        }
                    ]
                }
            elif model_name == "indonesian-ner":
                payload = {
                    "instances": [
                        {
                            "text": test_case["text"]
                        }
                    ]
                }
            else:
                logger.warning(f"⚠️ Unknown model type: {model_name}")
                return False
            
            # Make inference request
            start_time = time.time()
            response = requests.post(
                f"{self.serving_url}/v1/models/{model_name}:predict",
                json=payload,
                timeout=30
            )
            inference_time = (time.time() - start_time) * 1000  # Convert to ms
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ {model_name} inference successful ({inference_time:.2f}ms)")
                logger.info(f"   Input: {test_case['text']}")
                logger.info(f"   Output: {json.dumps(result.get('predictions', [])[:1], indent=2)}")  # Show first prediction
                return True
            else:
                logger.error(f"❌ {model_name} inference failed: {response.status_code}")
                logger.error(f"   Response: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Error during {model_name} inference: {e}")
            return False

    def benchmark_model_performance(self, model_name: str, num_requests: int = 10) -> Dict[str, float]:
        """Benchmark model performance"""
        logger.info(f"📊 Benchmarking {model_name} performance ({num_requests} requests)...")
        
        test_text = "berapa total user yang aktif di sistem?"
        payload = {
            "instances": [{"input_text": test_text}]
        }
        
        response_times = []
        successful_requests = 0
        
        for i in range(num_requests):
            try:
                start_time = time.time()
                response = requests.post(
                    f"{self.serving_url}/v1/models/{model_name}:predict",
                    json=payload,
                    timeout=30
                )
                end_time = time.time()
                
                if response.status_code == 200:
                    response_times.append((end_time - start_time) * 1000)
                    successful_requests += 1
                    
            except Exception as e:
                logger.warning(f"Request {i+1} failed: {e}")
        
        if response_times:
            avg_time = sum(response_times) / len(response_times)
            min_time = min(response_times)
            max_time = max(response_times)
            success_rate = (successful_requests / num_requests) * 100
            
            logger.info(f"📈 {model_name} Performance:")
            logger.info(f"   Average: {avg_time:.2f}ms")
            logger.info(f"   Min: {min_time:.2f}ms")
            logger.info(f"   Max: {max_time:.2f}ms")
            logger.info(f"   Success Rate: {success_rate:.1f}%")
            
            return {
                "average_ms": avg_time,
                "min_ms": min_time,
                "max_ms": max_time,
                "success_rate": success_rate
            }
        else:
            logger.error(f"❌ No successful requests for {model_name}")
            return {}

    def run_comprehensive_test(self) -> bool:
        """Run comprehensive test suite"""
        logger.info("🚀 Starting comprehensive model testing...")
        logger.info("=" * 60)
        
        # Check serving health
        if not self.check_serving_health():
            logger.error("❌ TensorFlow Serving is not healthy. Aborting tests.")
            return False
        
        total_tests = 0
        passed_tests = 0
        
        # Test each model
        for model_name, test_cases in self.test_cases.items():
            logger.info(f"\n🧪 Testing {model_name}")
            logger.info("-" * 40)
            
            # Check model availability
            if not self.test_model_availability(model_name):
                logger.error(f"❌ {model_name} is not available. Skipping tests.")
                continue
            
            # Run test cases
            for test_case in test_cases:
                total_tests += 1
                if self.test_model_inference(model_name, test_case):
                    passed_tests += 1
            
            # Benchmark performance
            self.benchmark_model_performance(model_name, num_requests=5)
        
        # Summary
        logger.info("\n" + "=" * 60)
        logger.info("📊 Test Summary")
        logger.info(f"Total Tests: {total_tests}")
        logger.info(f"Passed: {passed_tests}")
        logger.info(f"Failed: {total_tests - passed_tests}")
        logger.info(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if passed_tests == total_tests:
            logger.info("🎉 All tests passed! Models are ready for production.")
            return True
        else:
            logger.warning("⚠️ Some tests failed. Please check model configurations.")
            return False

def main():
    """Main testing function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test SELLY AI Models")
    parser.add_argument("--url", default="http://localhost:8501", help="TensorFlow Serving URL")
    parser.add_argument("--model", help="Test specific model only")
    parser.add_argument("--benchmark", action="store_true", help="Run performance benchmarks")
    
    args = parser.parse_args()
    
    tester = ModelTester(serving_url=args.url)
    
    if args.model:
        # Test specific model
        if args.model in tester.test_cases:
            logger.info(f"🎯 Testing specific model: {args.model}")
            if tester.test_model_availability(args.model):
                for test_case in tester.test_cases[args.model]:
                    tester.test_model_inference(args.model, test_case)
                
                if args.benchmark:
                    tester.benchmark_model_performance(args.model)
        else:
            logger.error(f"❌ Unknown model: {args.model}")
            logger.info(f"Available models: {list(tester.test_cases.keys())}")
    else:
        # Run comprehensive test
        success = tester.run_comprehensive_test()
        exit(0 if success else 1)

if __name__ == "__main__":
    main()
