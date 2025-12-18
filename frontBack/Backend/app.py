import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
import whisper
from dotenv import load_dotenv
#from config import MODEL
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from pathlib import Path
import json
import tempfile
import re
from pyngrok import ngrok, conf
import os
from groq import Groq

load_dotenv()

auth_ngrok = os.getenv("NGROK_AUTH_TOKEN", "fake auth")
pyngrok_config = conf.PyngrokConfig(auth_token=auth_ngrok)

client_groq = Groq(api_key=os.getenv("GROQ_API_KEY"))

ngrok.set_auth_token(auth_ngrok)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,#Allow the use of different domains (localhost:8000\localhost:5173)
    allow_origins = ["*"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

#llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")
llm = ChatOpenAI(model="gpt-5.1")
outputParser = StrOutputParser()

async def transcripton(audioFile : UploadFile):
    try:
        listSegments = []
        temp = Path(audioFile.filename).suffix
        content = await audioFile.read()
        with tempfile.NamedTemporaryFile(suffix=temp, delete=False) as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name
        #model = whisper.load_model("base")
        #result = await run_in_threadpool(model.transcribe, temp_file_path, language='portuguese')#tanscription is a sync function, the run_in_threadpool allows to an asyn function run normally
        text = client_groq.audio.transcriptions.create(
            file=(temp_file_path, content),
            model="whisper-large-v3",
            response_format="text"
        )
        '''for segment in result["segments"]:
            listSegments.append(segment['text'])
        text = '\n'.join(listSegments)
        '''
        return text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in the transcription: {e}")
    
async def createAbstract(text : str):
    try:
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", "Você é um assistente que resume transcrições, em formato de markdown, de aulas. Responsa apenas com o markdown e o título."),
            ("human", "{transcription}")
        ])
        chain = prompt_template | llm | outputParser
        result = chain.invoke({"transcription" : text})
        match = re.search(r"\#.*", result, re.DOTALL)
        if not match:
            raise HTTPException(status_code=500, detail=f"Invalid abstract format: {result}")
        return match.group(0)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in generate abstract: {e}")
    
async def createMindMap(text : str):
    try:
        prompt = f"""
        Baseado no texto a seguir, gere uma estrutura de mapa mental, da esquerda para a direita, para React Flow.
        O output DEVE ser um objeto JSON válido contendo duas chaves: "nodes" e "edges".

        1. "nodes" deve ser um array de objetos. Cada objeto deve ter:
        - "id": um ID de string único (ex: "1", "2", "a", "b").
        - "data": um objeto contendo uma chave "label" com o texto do nó (ex: {{ "label": "Meu Tópico" }}).
        - "position": um objeto contendo duas chaves "x" e "y" do tipo float (ex: {{"x":0, "y":0}})
        - "sourcePosition": uma string que diz que ponto do nó de origem da aresta vai conectar (ex: "right")
        - "targetPosition": uma string que diz que ponto do nó de destino da aresta vai conectar (ex: "left")
       
        2. "edges" deve ser um array de objetos. Cada objeto deve ter:
        - "id": um ID de string único para a aresta (ex: "e1-2").
        - "source": o "id" (string) do nó de origem.
        - "target": o "id" (string) do nó de destino.
       
        - Crie um nó raiz (id: "1") para o tópico principal e conecte outros conceitos a ele.
        - Tente espaçar os outros nós para que não se sobreponham.

        Exemplo de formato de saída:
        {{
            "nodes": [
                {{ "id": "1", "data": {{ "label": "Tópico Principal" }}, "position": {{ "x": 0, "y": 200 }}, "sourcePosition": "right", "targetPosition": "left" }},
                {{ "id": "2", "data": {{ "label": "Subtópico A" }}, "position": {{ "x": 200, "y":  0}}, "sourcePosition": "right", "targetPosition": "left" }}, 
                {{ "id": "3", "data": {{ "label": "Subtópico B" }}, "position": {{ "x": 200, "y": 200 }}, "sourcePosition": "right", "targetPosition": "left" }}
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
        match = re.search(r"\{.*\}", result, re.DOTALL)#greedy *
        if not match:
            raise HTTPException(status_code=500, detail=f"LLM doesn't returned a valid JSON {result}")
        generatedJSON = match.group(0)
        mindMapData = json.loads(generatedJSON)
        return mindMapData
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="LLM returned a bad formated JSON (JSONDecodeError).")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in generating mind map: {e}")

async def createQuiz(abstract : str):
    try:
        prompt = f"""
        Baseado no texto a seguir, gere um questionário e um gabarito para o questionário gerado.

        1. O questinário deve conter:
        - 10 questões de múltipla escolha
        - Cada questão possui 5 alternativas, 4 erradas e 1 correta
        - As alternativas devem ser listadas com letras em ordem alfabética

        2. Após o questionário, o gabarito a ser gerado deve conter:
        - O número de cada questão acompanhado pela letra da alternativa certa de cada uma

        Exemplo de formato de saída:
        Questionário:
        1. Primeira pergunta
            a. resposta1
            b. resposta2
            c. resposta3
            d. resposta4
            e. resposta5
        1. Primeira pergunta
            a. resposta1
            b. resposta2
            c. resposta3
            d. resposta4
            e. resposta5
        .
        .
        .
        10. Décima pergunta
            a. resposta1
            b. resposta2
            c. resposta3
            d. resposta4
            e. resposta5

        Gabarito:
        1. a.
        2. e.
        3. b.
        .
        .
        .
        10. b.

        Texto pra analisar:
        {abstract}
        """
        promptTemplate = ChatPromptTemplate.from_messages([
            ("system", "Você é um assistente especializado em criar questionários de 10 questões juntamente com gabaritos a partir de um resumo."),
            ("human", "{prompt}")
        ])
        chain = promptTemplate | llm | outputParser
        result = chain.invoke({"prompt" : prompt})
        quiz = re.search(r"Questionário:\s*(.*?)(?=\s*Gabarito:)", result, re.DOTALL)#?(lazy) ?=(lookahead)
        answers = re.search(r"Gabarito:\s*(.*10\.\s*[a-e]\.)", result, re.DOTALL)
        if not answers or not quiz:
            raise HTTPException(status_code=500, detail=f"No corresponding answers or quiz: {result}")
        dict = {}
        dict.update({
            "quiz" : quiz.group(1),
            "answers" : answers.group(1)
        })
        return dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in generating quiz: {e}")
    

@app.post("/process_audio")
async def processAudio(file : UploadFile = File(...)):
    if not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="The file uploaded must be an audio.")
    
    transcriptedText = await transcripton(file)

    abstract = await createAbstract(transcriptedText)

    mindMap = await createMindMap(abstract)

    quiz = await createQuiz(abstract)

    return{
        "abstract": abstract,
        "mindMap": mindMap,
        "quiz" : quiz['quiz'],
        "answers" :  quiz['answers']
    }

public_url = ngrok.connect(addr="8000", proto="http", domain="postoperative-veda-imperforate.ngrok-free.dev", pyngrok_config=pyngrok_config).public_url

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)#uvicorn app:app --host 0.0.0.0 --port 8000