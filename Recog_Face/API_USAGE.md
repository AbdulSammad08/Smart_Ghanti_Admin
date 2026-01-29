# Face Recognition API Documentation

## Starting the API Server

```bash
python api.py
```

The server will start on `http://localhost:5000`

## Endpoints

### 1. Health Check
**GET** `/health`

Check if the API is running.

**Response:**
```json
{
  "status": "ok",
  "message": "Face Recognition API is running"
}
```

---

### 2. Recognize Faces (Detailed)
**POST** `/recognize`

Recognize faces in an uploaded image with full details.

#### Option A: Base64 Encoded Image (JSON)
**Request:**
```json
{
  "image": "base64_encoded_image_string"
}
```

#### Option B: Multipart Form Data
**Request:**
- Form field: `image` (file upload)

**Response:**
```json
{
  "success": true,
  "authenticated": true,
  "message": "Authenticated as Ali",
  "faces_detected": 2,
  "recognized_count": 1,
  "unknown_count": 1,
  "recognized_names": ["Ali"],
  "timestamp": "2023-12-07T10:30:45.123456",
  "faces": [
    {
      "name": "Ali",
      "recognized": true,
      "confidence": "high",
      "bbox": {
        "x1": 100,
        "y1": 150,
        "x2": 300,
        "y2": 350
      }
    },
    {
      "name": "Unknown",
      "recognized": false,
      "confidence": "none",
      "bbox": {
        "x1": 400,
        "y1": 200,
        "x2": 600,
        "y2": 400
      }
    }
  ]
}
```

---

### 3. Authenticate (Simple)
**POST** `/authenticate`

Simple authentication endpoint - returns yes/no result.

**Request:**
```json
{
  "image": "base64_encoded_image_string"
}
```

**Response:**
```json
{
  "authenticated": true,
  "person": "Ali",
  "all_recognized": ["Ali"],
  "faces_count": 1
}
```

---

### 4. Add New Person
**POST** `/add_person`

Add a new person to the face recognition database.

**Request:**
```json
{
  "name": "PersonName",
  "image": "base64_encoded_image_string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Image added for PersonName",
  "note": "Database will auto-rebuild on next recognition"
}
```

---

## Flutter Integration Example

### 1. Add Dependencies to `pubspec.yaml`
```yaml
dependencies:
  http: ^1.1.0
  image_picker: ^1.0.4
```

### 2. Flutter Code Example

```dart
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';

class FaceRecognitionService {
  static const String baseUrl = 'http://YOUR_SERVER_IP:5000';
  
  // Recognize faces in image
  Future<Map<String, dynamic>> recognizeFace(File imageFile) async {
    try {
      // Convert image to base64
      List<int> imageBytes = await imageFile.readAsBytes();
      String base64Image = base64Encode(imageBytes);
      
      // Send request
      final response = await http.post(
        Uri.parse('$baseUrl/recognize'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'image': base64Image}),
      );
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to recognize face');
      }
    } catch (e) {
      print('Error: $e');
      rethrow;
    }
  }
  
  // Alternative: Using multipart form data
  Future<Map<String, dynamic>> recognizeFaceMultipart(File imageFile) async {
    try {
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/recognize'),
      );
      
      request.files.add(
        await http.MultipartFile.fromPath('image', imageFile.path),
      );
      
      var response = await request.send();
      var responseData = await response.stream.bytesToString();
      
      if (response.statusCode == 200) {
        return jsonDecode(responseData);
      } else {
        throw Exception('Failed to recognize face');
      }
    } catch (e) {
      print('Error: $e');
      rethrow;
    }
  }
  
  // Add new person
  Future<Map<String, dynamic>> addPerson(String name, File imageFile) async {
    try {
      List<int> imageBytes = await imageFile.readAsBytes();
      String base64Image = base64Encode(imageBytes);
      
      final response = await http.post(
        Uri.parse('$baseUrl/add_person'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'name': name,
          'image': base64Image,
        }),
      );
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to add person');
      }
    } catch (e) {
      print('Error: $e');
      rethrow;
    }
  }
}

// Usage Example
void main() async {
  final service = FaceRecognitionService();
  
  // Pick image
  final picker = ImagePicker();
  final XFile? image = await picker.pickImage(source: ImageSource.gallery);
  
  if (image != null) {
    File imageFile = File(image.path);
    
    // Recognize face
    var result = await service.recognizeFace(imageFile);
    print('Faces detected: ${result['faces_detected']}');
    print('Recognized: ${result['recognized_count']}');
    
    for (var face in result['faces']) {
      print('Name: ${face['name']}, Recognized: ${face['recognized']}');
    }
  }
}
```

---

## Testing with cURL

### Test Health Check
```bash
curl http://localhost:5000/health
```

### Test Face Recognition (with file)
```bash
curl -X POST -F "image=@path/to/image.jpg" http://localhost:5000/recognize
```

### Test Add Person
```bash
# First, convert image to base64
base64_image=$(base64 -w 0 path/to/image.jpg)

# Then send request
curl -X POST http://localhost:5000/add_person \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"John\", \"image\": \"$base64_image\"}"
```

---

## Notes

- The API automatically rebuilds the face database when dataset changes
- Images are processed in memory, not saved (except when using `/add_person`)
- The server runs on port 5000 by default
- CORS is enabled for cross-origin requests
- Replace `YOUR_SERVER_IP` with your actual server IP address in Flutter app
