import cv2
import tkinter as tk
from tkinter import filedialog, ttk
from PIL import Image, ImageTk
from .recognize import Recognizer

class FaceGUI:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Face Recognition System")
        self.root.geometry("900x700")
        self.root.resizable(True, True)

        # Title
        title = tk.Label(self.root, text="Face Recognition System", font=("Arial", 18, "bold"), bg="#2c3e50", fg="white", pady=10)
        title.pack(fill=tk.X)

        # Button frame
        btn_frame = tk.Frame(self.root, pady=10)
        btn_frame.pack()
        
        self.btn = tk.Button(btn_frame, text="Select Image", command=self.load_image, 
                            font=("Arial", 12), bg="#3498db", fg="white", padx=20, pady=10, cursor="hand2")
        self.btn.pack()

        # Results frame
        self.result_frame = tk.Frame(self.root, pady=10)
        self.result_frame.pack()
        
        self.result_label = tk.Label(self.result_frame, text="No image loaded", 
                                     font=("Arial", 12), fg="#7f8c8d")
        self.result_label.pack()

        # Image display area
        self.img_frame = tk.Frame(self.root, bg="#ecf0f1", relief=tk.SUNKEN, bd=2)
        self.img_frame.pack(padx=20, pady=10, fill=tk.BOTH, expand=True)
        
        self.label = tk.Label(self.img_frame, bg="#ecf0f1")
        self.label.pack(expand=True)

        try:
            self.result_label.config(text="Initializing...", fg="blue")
            self.root.update()
            self.recognizer = Recognizer()
            self.result_label.config(text="Ready - Select an image to recognize faces", fg="#7f8c8d")
        except Exception as e:
            self.result_label.config(text=f"Error initializing: {str(e)}", fg="red")
        
        self.root.mainloop()

    def load_image(self):
        path = filedialog.askopenfilename(
            title="Select an image",
            filetypes=[("Image files", "*.jpg *.jpeg *.png *.bmp")]
        )

        if not path:
            return

        frame = cv2.imread(path)
        if frame is None:
            self.result_label.config(text="Error: Invalid image file", fg="red")
            return

        results = self.recognizer.recognize(frame)

        # Display results
        if len(results) == 0:
            self.result_label.config(text="❌ No faces detected in the image", fg="red", font=("Arial", 14, "bold"))
        else:
            recognized = [name for (_, _, _, _, name) in results if name != "Unknown"]
            unknown = [name for (_, _, _, _, name) in results if name == "Unknown"]
            
            result_text = f"✓ Detected {len(results)} face(s): "
            if recognized:
                result_text += f"{len(recognized)} Recognized ({', '.join(recognized)})"
            if unknown:
                result_text += f" | {len(unknown)} Unknown"
            
            self.result_label.config(text=result_text, fg="green", font=("Arial", 14, "bold"))

        # Draw detections
        for (x1, y1, x2, y2, name) in results:
            color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 3)
            
            # Background for text
            (text_w, text_h), _ = cv2.getTextSize(name, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)
            cv2.rectangle(frame, (x1, y1 - text_h - 10), (x1 + text_w, y1), color, -1)
            cv2.putText(frame, name, (x1, y1 - 5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

        # Resize image to fit window
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        h, w = rgb.shape[:2]
        max_w, max_h = 850, 500
        
        scale = min(max_w/w, max_h/h, 1.0)
        new_w, new_h = int(w*scale), int(h*scale)
        
        rgb_resized = cv2.resize(rgb, (new_w, new_h), interpolation=cv2.INTER_AREA)
        img = ImageTk.PhotoImage(Image.fromarray(rgb_resized))

        self.label.imgtk = img
        self.label.configure(image=img)
