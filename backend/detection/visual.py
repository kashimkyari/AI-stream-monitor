import cv2
import numpy as np
import torch
import random
import os

loaded_model = None

def load_yolo_model():
    global loaded_model
    # Placeholder for real YOLO loading logic
    # e.g.:
    # loaded_model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)
    loaded_model = True  # Simulate a loaded model

load_yolo_model()

def detect(stream_url):
    if not loaded_model:
        return None

    # Real approach: capture a frame from the stream and run YOLO inference
    # For demonstration, simulate random detection
    flagged_objects = ["knife", "gun", "rifle", "blade"]
    if random.randint(0, 10) > 8:
        obj = random.choice(flagged_objects)
        return f"Object detected: {obj}"
    return None

