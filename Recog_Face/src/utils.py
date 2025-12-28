import cv2
import os

def load_images_from_folder(folder):
    imgs = []
    for f in os.listdir(folder):
        if f.lower().endswith((".jpg", ".png", ".jpeg")):
            path = os.path.join(folder, f)
            img = cv2.imread(path)
            if img is not None:
                imgs.append(img)
    return imgs
