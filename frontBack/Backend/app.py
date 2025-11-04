import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
import whisper
from dotenv import load_dotenv
from config import MODEL
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from pathlib import Path
import json
import tempfile
import shutil
import re

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins = ["https://localhost:3000", "http://localhost:5173"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

llm = ChatGoogleGenerativeAI(model=MODEL)
outputParser = StrOutputParser()

async def transcripton(audioFile : UploadFile):
    try:
        listSegments = []
        temp = Path(audioFile.filename).suffix
        with tempfile.NamedTemporaryFile(suffix=temp, delete=False) as temp_file:
            shutil.copyfileobj(audioFile.file, temp_file)
            temp_file_path = temp_file.name
        model = whisper.load_model("base")
        result = await run_in_threadpool(model.transcribe, temp_file_path, language='portuguese')
        for segment in result["segments"]:
            listSegments.append(segment['text'])
        text = '\n'.join(listSegments)
        return text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in the transcription: {e}")
    
async def createAbstract(text : str):
    try:
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", "Você é um assistente que resume transcrições de aulas."),
            ("human", "{transcription}")
        ])
        chain = prompt_template | llm | outputParser
        result = chain.invoke({"transcription" : text})
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in generate abstract: {e}")
    
async def createMindMap(text : str):
    try:
        prompt = f"""
        Baseado no texto a seguir, gere uma estrutura de mapa mental para React Flow.
        O output DEVE ser um objeto JSON válido contendo duas chaves: "nodes" e "edges".

        1. "nodes" deve ser um array de objetos. Cada objeto deve ter:
        - "id": um ID de string único (ex: "1", "2", "a", "b").
        - "data": um objeto contendo uma chave "label" com o texto do nó (ex: {{ "label": "Meu Tópico" }}).
        - "position": um objeto contendo duas chaves "x" e "y" do tipo float (ex: {{"x":0, "y":0}})
       
        2. "edges" deve ser um array de objetos. Cada objeto deve ter:
        - "id": um ID de string único para a aresta (ex: "e1-2").
        - "source": o "id" (string) do nó de origem.
        - "target": o "id" (string) do nó de destino.
       
        - Crie um nó raiz (id: "1") para o tópico principal e conecte outros conceitos a ele.
        - Tente espaçar os outros nós para que não se sobreponham.

        Exemplo de formato de saída:
        {{
            "nodes": [
                {{ "id": "1", "data": {{ "label": "Tópico Principal" }}, "position": {{ "x": 250, "y": 50 }} }},
                {{ "id": "2", "data": {{ "label": "Subtópico A" }}, "position": {{ "x": 100, "y": 150 }} }}, 
                {{ "id": "3", "data": {{ "label": "Subtópico B" }}, "position": {{ "x": 200, "y": 150 }} }}
            ],
            "edges": [
                {{ "id": "e1-2", "source": "1", "target": "2" }},
                {{ "id": "e1-3", "source": "1", "target": "3" }}
            ]
        }}

        Texto para analisar:
        {text}
        """
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", "Você é um assistente que gera mapas mentais em formato JSON para React Flow"),
            ("human", "{prompt}")
        ])
        chain = prompt_template | llm | outputParser
        result = chain.invoke({"prompt" : prompt})
        match = re.search(r"\{.*\}", result, re.DOTALL)
        if not match:
            raise HTTPException(status_code=500, detail=f"LLM doesn't returned a valid JSON {result}")
        generatedJSON = match.group(0)
        mindMapData = json.loads(generatedJSON)
        return mindMapData
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="LLM returned a bad formated JSON (JSONDecodeError).")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in generating mind map: {e}")

@app.post("/process_audio/")
async def processAudio(file : UploadFile = File(...)):
    if not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="The file uploaded must be an audio.")
    
    transcriptedText = await transcripton(file)

    abstract = await createAbstract(transcriptedText)

    mindMap = await createMindMap(abstract)

    return{
        "abstract": abstract,
        "mindMap": mindMap
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)