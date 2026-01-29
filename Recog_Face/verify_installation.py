"""
Installation Verification Script
Run this after installing requirements to verify everything is set up correctly
"""

import sys

def check_python_version():
    """Check Python version"""
    print("Checking Python version...")
    version = sys.version_info
    if version.major == 3 and version.minor == 10:
        print(f"[OK] Python {version.major}.{version.minor}.{version.micro}")
        return True
    else:
        print(f"[FAIL] Python {version.major}.{version.minor}.{version.micro} - Expected 3.10.x")
        return False

def check_package(package_name, expected_version=None):
    """Check if package is installed"""
    try:
        module = __import__(package_name)
        version = getattr(module, '__version__', 'unknown')
        
        if expected_version and version != expected_version:
            print(f"[WARN] {package_name} {version} - Expected {expected_version}")
            return True  # Still works, just warning
        else:
            print(f"[OK] {package_name} {version}")
            return True
    except ImportError:
        print(f"[FAIL] {package_name} - NOT INSTALLED")
        return False

def main():
    print("=" * 60)
    print("Face Recognition System - Installation Verification")
    print("=" * 60 + "\n")
    
    results = []
    
    # Check Python version
    results.append(("Python 3.10", check_python_version()))
    print()
    
    # Check core packages
    print("Checking core packages...")
    results.append(("tensorflow", check_package("tensorflow", "2.11.0")))
    results.append(("keras", check_package("keras", "2.11.0")))
    results.append(("numpy", check_package("numpy", "1.26.4")))
    print()
    
    # Check computer vision
    print("Checking computer vision packages...")
    results.append(("cv2 (opencv)", check_package("cv2", "4.12.0")))
    results.append(("PIL (Pillow)", check_package("PIL", "12.0.0")))
    print()
    
    # Check face recognition
    print("Checking face recognition packages...")
    results.append(("deepface", check_package("deepface", "0.0.96")))
    print()
    
    # Check YOLO
    print("Checking YOLO packages...")
    results.append(("ultralytics", check_package("ultralytics")))
    results.append(("torch", check_package("torch")))
    results.append(("torchvision", check_package("torchvision")))
    print()
    
    # Check API packages
    print("Checking API packages...")
    results.append(("flask", check_package("flask", "3.1.2")))
    results.append(("flask_cors", check_package("flask_cors")))
    print()
    
    # Check utilities
    print("Checking utility packages...")
    results.append(("requests", check_package("requests", "2.32.5")))
    results.append(("scipy", check_package("scipy", "1.15.3")))
    results.append(("tqdm", check_package("tqdm", "4.67.1")))
    print()
    
    # Summary
    print("=" * 60)
    print("VERIFICATION SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "[PASS]" if result else "[FAIL]"
        print(f"{name:.<40} {status}")
    
    print(f"\nTotal: {passed}/{total} checks passed")
    
    if passed == total:
        print("\n[SUCCESS] All checks passed! System is ready to use.")
        print("\nNext steps:")
        print("  1. Add images to dataset/ folder")
        print("  2. Run: python gui.py")
        print("  3. Or run: python recognize.py")
        print("  4. Or run: python api.py")
    else:
        print("\n[ERROR] Some checks failed. Please install missing packages:")
        print("  pip install -r requirements.txt")
    
    print("=" * 60 + "\n")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
