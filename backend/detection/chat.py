import random

def detect(stream_url):
    # Simulated AI for chat keyword detection:
    simulated_messages = [
        "Hello everyone",
        "This stream is amazing",
        "I hate you",
        "There is a gun here",
        "Watch out for that knife",
        "No issues here"
    ]
    message = random.choice(simulated_messages)
    # Check for flagged keywords (in a real scenario, these would come from the DB)
    flagged_keywords = ["gun", "knife", "hate"]
    for keyword in flagged_keywords:
        if keyword in message.lower():
            return f"Chat flagged: {keyword}"
    return None

