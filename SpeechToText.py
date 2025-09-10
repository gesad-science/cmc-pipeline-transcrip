import whisper

model = whisper.load_model("base")

audio = "audioHistoria.mp3"

result = model.transcribe(audio, language="portuguese")

with open("transcriptedText.txt", "w", encoding="utf-8") as f:
    for segment in result['segments']:
        f.write(segment['text'] + "\n")
    
with open("logprob.txt", "w", encoding="utf-8") as f:
    for segment in result['segments']:
        f.write(str(segment['avg_logprob']) + "\n")