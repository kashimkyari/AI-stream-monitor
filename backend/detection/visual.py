import cv2
import torch
import numpy as np
import random
import sys

# Remove local 'models' module if present to avoid conflict with YOLOv5's repository
if 'models' in sys.modules:
    del sys.modules['models']

# Load YOLOv5 model from torch.hub (this will download the model if needed)
model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True, trust_repo=True)
CONF_THRESHOLD = 0.5  # confidence threshold

def detect(stream_url):
    cap = cv2.VideoCapture(stream_url)
    ret, frame = cap.read()
    cap.release()
    if not ret:
        return None
    results = model(frame)
    detections = results.xyxy[0]
    for *box, conf, cls in detections:
        if conf.item() >= CONF_THRESHOLD:
            class_name = model.names[int(cls)]
            return f"Object detected: {class_name} (confidence: {conf.item():.2f})"
    return None

