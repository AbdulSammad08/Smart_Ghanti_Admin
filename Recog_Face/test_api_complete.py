import requests
import base64
import json
import os
import time

API_URL = "http://localhost:5000"

def test_health():
    """Test health check"""
    print("=" * 60)
    print("TEST 1: Health Check")
    print("=" * 60)
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        print(f"✓ Status: {response.status_code}")
        print(f"✓ Response: {response.json()}\n")
        return True
    except Exception as e:
        print(f"✗ Error: {e}\n")
        return False

def test_recognize_with_base64(image_path):
    """Test full recognition with base64"""
    print("=" * 60)
    print("TEST 2: Face Recognition (Base64)")
    print("=" * 60)
    
    if not os.path.exists(image_path):
        print(f"✗ Image not found: {image_path}\n")
        return False
    
    try:
        # Read and encode image
        with open(image_path, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
        
        print(f"Sending image: {image_path}")
        print(f"Image size: {len(image_data)} bytes (base64)")
        
        # Send request
        response = requests.post(
            f"{API_URL}/recognize",
            headers={'Content-Type': 'application/json'},
            json={'image': image_data},
            timeout=30
        )
        
        print(f"\n✓ Status Code: {response.status_code}")
        result = response.json()
        print(f"\n✓ Response:")
        print(json.dumps(result, indent=2))
        
        # Display results
        print(f"\n{'='*60}")
        print("RECOGNITION RESULTS:")
        print(f"{'='*60}")
        print(f"✓ Success: {result.get('success')}")
        print(f"✓ Authenticated: {result.get('authenticated')}")
        print(f"✓ Message: {result.get('message')}")
        print(f"✓ Faces Detected: {result.get('faces_detected')}")
        print(f"✓ Recognized: {result.get('recognized_count')}")
        print(f"✓ Unknown: {result.get('unknown_count')}")
        
        if result.get('recognized_names'):
            print(f"✓ Recognized Names: {', '.join(result['recognized_names'])}")
        
        print(f"{'='*60}\n")
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}\n")
        import traceback
        traceback.print_exc()
        return False

def test_authenticate(image_path):
    """Test simple authentication"""
    print("=" * 60)
    print("TEST 3: Simple Authentication")
    print("=" * 60)
    
    if not os.path.exists(image_path):
        print(f"✗ Image not found: {image_path}\n")
        return False
    
    try:
        with open(image_path, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
        
        response = requests.post(
            f"{API_URL}/authenticate",
            headers={'Content-Type': 'application/json'},
            json={'image': image_data},
            timeout=30
        )
        
        print(f"✓ Status Code: {response.status_code}")
        result = response.json()
        print(f"\n✓ Response:")
        print(json.dumps(result, indent=2))
        
        print(f"\n{'='*60}")
        print("AUTHENTICATION RESULT:")
        print(f"{'='*60}")
        print(f"✓ Authenticated: {result.get('authenticated')}")
        print(f"✓ Person: {result.get('person')}")
        print(f"✓ Faces Count: {result.get('faces_count')}")
        print(f"{'='*60}\n")
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}\n")
        return False

def test_multipart_upload(image_path):
    """Test with file upload"""
    print("=" * 60)
    print("TEST 4: Multipart File Upload")
    print("=" * 60)
    
    if not os.path.exists(image_path):
        print(f"✗ Image not found: {image_path}\n")
        return False
    
    try:
        with open(image_path, 'rb') as f:
            files = {'image': f}
            response = requests.post(f"{API_URL}/recognize", files=files, timeout=30)
        
        print(f"✓ Status Code: {response.status_code}")
        result = response.json()
        print(f"\n✓ Authenticated: {result.get('authenticated')}")
        print(f"✓ Faces Detected: {result.get('faces_detected')}")
        print(f"✓ Message: {result.get('message')}\n")
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}\n")
        return False

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("FACE RECOGNITION API - COMPLETE TEST SUITE")
    print("=" * 60 + "\n")
    
    # Wait for server to start
    print("Waiting for server to start...")
    time.sleep(2)
    
    # Test 1: Health check
    if not test_health():
        print("⚠ Server not responding. Make sure api.py is running!")
        print("Run: python api.py")
        exit(1)
    
    # Find test image
    test_image = None
    dataset_dir = "dataset"
    
    if os.path.exists(dataset_dir):
        for person in os.listdir(dataset_dir):
            person_path = os.path.join(dataset_dir, person)
            if os.path.isdir(person_path):
                images = [f for f in os.listdir(person_path) 
                         if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                if images:
                    test_image = os.path.join(person_path, images[0])
                    break
    
    if not test_image:
        print("⚠ No test images found in dataset/")
        print("Please add some images to test with.")
        exit(1)
    
    print(f"Using test image: {test_image}\n")
    
    # Run all tests
    results = []
    results.append(("Health Check", test_health()))
    results.append(("Recognition (Base64)", test_recognize_with_base64(test_image)))
    results.append(("Authentication", test_authenticate(test_image)))
    results.append(("Multipart Upload", test_multipart_upload(test_image)))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    for test_name, passed in results:
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{test_name:.<40} {status}")
    
    total = len(results)
    passed = sum(1 for _, p in results if p)
    print(f"\nTotal: {passed}/{total} tests passed")
    print("=" * 60 + "\n")
