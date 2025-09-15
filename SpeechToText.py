import whisper
from pathlib import Path
from config import ENCODING

model = whisper.load_model("base")

audio = Path("audioHistoria.mp3")

result = model.transcribe(str(audio), language="portuguese")

text = Path("transcriptedText.txt")

probs = Path("logprob.txt")

with open(text, "w", encoding=ENCODING) as f:
    for segment in result['segments']:
        f.write(segment['text'] + "\n")
    
with open(probs, "w", encoding=ENCODING) as f:
    for segment in result['segments']:
        f.write(str(segment['avg_logprob']) + "\n")