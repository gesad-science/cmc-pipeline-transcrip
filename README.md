# MindClass
MindClass is an application that receives an audio (.wav, .mp3, etc.) and returns the following objects from the content of the received audio and LLM prompts:
- Abstract
- Mind map
- Quiz
- Template
  
## Pipeline:
1. Upload of the audio from the user
2. The audio is sent to the server via HTTP methods to realease the transcription proccess
3. When the content of the transcription is finished, the text is sent to LLM models (gemini and gpt) with prompts through api keys to prepare the followin products:
   1. The abstract of the audio content
   2. The mind map of the audio content
   3. The Quiz of the audio content
   4. The template of the quiz
4. When all the products are finished, the server send all of them to the user

##Important Commands:
- Frontend folder:
  - npm install vite (Its necessary to install vite)
  - npm install @capacitor/core @capacitor/cli (Install capacitor, the library that connects the frontend project to the android studio)
  - npm install @capacitor/android (The package from capacitor that connects with android)
  - npm run dev (Test the frontend of the project)
  - npm run bulid (Creates the HTML/CSS/Javascript for the mobile application with the new features to the dist folder)
  - npx sync android (Update the android folder with the content of the dist)
  - npx cap open android (Open android studio in the android folder)

- Backend folder:
  - uvicorn app:app --host 0.0.0.0 --port 8000 (Run the server that receives audio from any type of user)
