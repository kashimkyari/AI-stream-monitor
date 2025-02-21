import random

def detect(stream_url):
    # Simulated AI for object recognition:
    flagged_objects = ["knife", "gun"]
    if random.randint(0, 10) > 8:
        detected = random.choice(flagged_objects)
        return f"Object detected: {detected}"
    return None

