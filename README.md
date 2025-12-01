# cmc-pipeline-transcrip
## Pipeline:
Frontend: Input audio and it'll return the image of the mindmap with/without the abstract of the audio (React)

Backend: audio -> transcriptor -> txt of the audio -> LLM service -> abstract in txt of the audio -> LLM service -> JSON of the abstract to React-flow generate the mindmap (Python)
