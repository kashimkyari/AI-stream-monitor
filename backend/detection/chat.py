import random
import spacy

# Attempt to load spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except:
    nlp = None

def detect(stream_url):
    if not nlp:
        # If spaCy isn't available, skip detection
        return None

    # Simulate chat messages
    simulated_messages = [
        "Hello from Chaturbate",
        "This is a friendly chat on Stripchat",
        "I see a knife in the background",
        "No issues here",
        "He has a gun, watch out!"
    ]
    message = random.choice(simulated_messages)

    # In a real scenario, you'd fetch flagged keywords from DB
    flagged_keywords = ["gun", "knife", "hate"]

    doc = nlp(message)
    # We'll just do a simple substring check
    for kw in flagged_keywords:
        if kw in message.lower():
            return f"Chat flagged: {kw} in '{message}'"
    return None

