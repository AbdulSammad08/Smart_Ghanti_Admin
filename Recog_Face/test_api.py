import requests
import base64
import json
import os

API_URL = "http://localhost:5000"

def test_health():
    """Test health check endpoint"""
    print("Testing health check...")
    response = requests.get(f"{API_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}\n")

def test_recognize_with_file(image_path):
    """Test face recognition with file upload"""
    print(f"Testing face recognition with file: {image_path}")
    
    if not os.path.exists(image_path):
        print(f"Error: Image file not found: {image_path}\n")
        return
    
    with open(image_path, 'rb') as f:
        files = {'image': f}
        response = requests.post(f"{API_URL}/recognize", files=files)
    
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Response: {json.dumps(result, indent=2)}\n")
    
    if result.get('success'):
        print(f"✓ Detected {result['faces_detected']} face(s)")
        print(f"  - Recognized: {result['recognized_count']}")
        print(f"  - Unknown: {result['unknown_count']}")
        for face in result['faces']:
            print(f"  - {face['name']} (Recognized: {face['recognized']})")
    print()

def test_recognize_with_base64(image_path):
    """Test face recognition with base64 encoded image"""
    print(f"Testing face recognition with base64: {image_path}")
    
    if not os.path.exists(image_path):
        print(f"Error: Image file not found: {image_path}\n")
        return
    
    with open(image_path, 'rb') as f:
        image_data = base64.b64encode(f.read()).decode('utf-8')
    
    response = requests.post(
        f"{API_URL}/recognize",
        headers={'Content-Type': 'application/json'},
        json={'image': image_data}
    )
    
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Response: {json.dumps(result, indent=2)}\n")

if __name__ == "__main__":
    print("=" * 50)
    print("Face Recognition API Test")
    print("=" * 50 + "\n")
    
    # Test health check
    test_health()
    
    # Test with sample images from dataset
    print("Looking for test images in dataset...")
    dataset_dir = "dataset"
    
    if os.path.exists(dataset_dir):
        for person in os.listdir(dataset_dir):
            person_path = os.path.join(dataset_dir, person)
            if os.path.isdir(person_path):
                images = [f for f in os.listdir(person_path) 
                         if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                if images:
                    test_image = os.path.join(person_path, images[0])
                    test_recognize_with_file(test_image)
                    break
    else:
        print("Dataset directory not found. Please provide an image path manually.")
        print("Usage: test_recognize_with_file('path/to/image.jpg')")
