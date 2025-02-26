import sys
# Remove local 'models' module if present to avoid conflicts with YOLOv5’s internal package.
if 'models' in sys.modules:
    del sys.modules['models']

import cv2
import torch
import numpy as np

# Set device and send the model to GPU if available
device = 'cuda' if torch.cuda.is_available() else 'cpu'
model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True, trust_repo=True)
model.to(device)
CONF_THRESHOLD = 0.5  # Default confidence threshold

def detect(stream_url):
    cap = cv2.VideoCapture(stream_url)
    ret, frame = cap.read()
    cap.release()
    if not ret:
        return None
    return detect_frame(frame)

def detect_frame(frame):
    results = model(frame)
    detections = results.xyxy[0]  # Tensor of detections
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

def detect_and_annotate_frame(frame):
    """Run object detection and annotate the frame with bounding boxes and labels."""
    results = model(frame)
    detections = results.xyxy[0]
    for *box, conf, cls in detections:
        if conf.item() >= CONF_THRESHOLD:
            class_name = model.names[int(cls)]
            x1, y1, x2, y2 = [int(x.item()) for x in box]
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(frame, f"{class_name} {conf.item():.2f}", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    return frame

def extract_detections(frame):
    """Return a list of detected objects (without annotation) including bounding boxes."""
    results = model(frame)
    detections = results.xyxy[0]
    objs = []
    for *box, conf, cls in detections:
        if conf.item() >= CONF_THRESHOLD:
            class_name = model.names[int(cls)]
            x1, y1, x2, y2 = [int(x.item()) for x in box]
            objs.append({
                'class': class_name,
                'confidence': conf.item(),
                'box': (x1, y1, x2, y2)
            })
    return objs
