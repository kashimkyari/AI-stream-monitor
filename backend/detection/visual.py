import sys
# Remove local 'models' module if present, to avoid conflict with YOLOv5's models package.
if 'models' in sys.modules:
    del sys.modules['models']

import cv2
import torch
import numpy as np

# Load YOLOv5 model from torch.hub (this downloads the model if not available)
model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True, trust_repo=True)
CONF_THRESHOLD = 0.5  # default confidence threshold

def detect(stream_url):
    cap = cv2.VideoCapture(stream_url)
    ret, frame = cap.read()
    cap.release()
    if not ret:
        return None
    return detect_frame(frame)

def detect_frame(frame):
    results = model(frame)
    detections = results.xyxy[0]  # tensor of detections
    detected = []
    for *box, conf, cls in detections:
        if conf.item() >= CONF_THRESHOLD:
            class_name = model.names[int(cls)]
            detected.append({
                'class': class_name,
                'confidence': conf.item(),
                'box': [float(x) for x in box]
            })
    return detected

