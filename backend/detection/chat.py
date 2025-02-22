import spacy
from spacy.matcher import Matcher

nlp = spacy.load("en_core_web_sm")
flagged_keywords = ["gun", "knife", "hate"]
matcher = Matcher(nlp.vocab)
for word in flagged_keywords:
    pattern = [{"LOWER": word}]
    matcher.add(word, [pattern])

def detect(stream_url):
    # In a full implementation, you'd process live chat data.
    # Here we simulate by processing a sample chat message.
    sample_message = "I think there is a gun and a knife in this scene."
    doc = nlp(sample_message)
    matches = matcher(doc)
    if matches:
        detected = set()
        for match_id, start, end in matches:
            span = doc[start:end]
            detected.add(span.text)
        return f"Chat flagged: {', '.join(detected)} in message: '{sample_message}'"
    return None

