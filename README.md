# MindClass
MindClass is an aplication that allows the user, via audio from classes, to generate aditional contents
that improve the understanding of what was said in the class's audio. At the moment the aplication has
a summary, a mind map and a questionnaire with 10 questions and the answers of them. All of the previous content
is about the audio received from the user.

## Pipeline:
![Image](https://github.com/user-attachments/assets/0c004a3e-b463-406e-a647-353cdc0e782b)

## Used Technologies:
### Backend:
- uvicorn: Serves to create an asynchronous server(ASGI) that runs the backend aplication.
- fastapi: Creates the API.
- langchain: Call API's of frontirer models of LLM's, gemini and gpt for example, and creates the template and pipeline
  of prompts to the LLM's.
- ngrok: Expose the local aplication to the web via a public URL.
- groq: Has a LPU, a hardware that is specialized in Transformers models execution, to process the Whisper model from
  openai.
- whisper: A model from OpenAI that is specialized in transcription of audios to texts.
### Frontend:
- ReactFlow: Creates the mind map visualization.
- ReactMarkdown: Format the text of the summary to Markdown.
- Capacitor: Traansform the web aplication in an android aplication via WebView.
- Vite: Provides a fast and optmized server of development.

## Inicialization:
### Backend:
- uvicorn app:app --host 0.0.0.0 --port 8000: Run the backend server.
### Frontend:
- npm install (Only if the dependences aren't installed yet): Install vite, capacitor and others dependecies.
- npm run dev: Execute the frontend test in the web.
- npm run build: Creates the html/css/Javascript for the mobile aplication into the dist folder.
- npx sync android: Update the android folder with the content from dist folder.
- npx cap open android: Open the android folder in the Android Studio.

In the android studio, install the apk version of the aplication

## Environment Variables:
- "NGROK_AUTH_TOKEN"
- "GROQ_API_KEY"
- "GEMINI_API_KEY"
- "OPENAI_API_KEY"
