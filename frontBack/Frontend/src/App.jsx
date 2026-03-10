import React, {useEffect, useState, useCallback} from 'react'
import {useDropzone} from 'react-dropzone'
import ReactMarkdown from 'react-markdown'
import ReactFlow, {
    Position,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
} from 'reactflow'
import api from './Services/api.js'
import 'reactflow/dist/style.css'
import Recorder from './Recorder'
import mindClass_logo from './Assets/mindClass_logo.png';
import { TiHome } from 'react-icons/ti';
import { FiDownload } from "react-icons/fi";
import { IoDocumentText } from "react-icons/io5";
import { RiMindMap } from "react-icons/ri";
import { MdAudioFile, MdQuiz } from "react-icons/md";
import { FaMicrophone } from "react-icons/fa";

function App(){
    const [selectedFile, setSelectedFile] = useState(null)
    const [abstract, setAbstract] = useState("")
    const [quiz, setQuiz] = useState("")
    const [answers, setAnswers] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [showAbstract, setShowAbstract] = useState(false)
    const [showMindMap, setShowMindMap] = useState(false)
    const [showQuiz, setShowQuiz] = useState(false)
    const [showAnswers, setShowAnswers] = useState(false)
    const [fileName, setFileName] = useState("")
    const [loadingText, setLoadingText] = useState("Criando conteúdo.")
    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])
    const [actualScreen, setActualScreen] = useState('home')

    const onDropFile = useCallback((acceptedFiles) => {
        setError(null)
        const file = acceptedFiles[0]
        setSelectedFile(file)
        setFileName(file.name)
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: onDropFile,
        accept: {
        'audio/*': ['.mp3', '.wav', '.m4a']
        },
        maxFiles: 1
    });

    const submitForm = async (event) => {
        event.preventDefault()

        if (!selectedFile){
            setError("Selecione um arquivo")
            return
        }

        setLoading(true)
        setActualScreen('loading')
        setError(null)
        setAbstract("")
        setNodes([])
        setEdges([])

        const formData = new FormData()
        formData.append("file", selectedFile)

        try{
            const response = await api.post("/process_audio", formData)
            const {abstract, mindMap, quiz, answers} = response.data
            setAbstract(abstract)
            setShowAbstract(true)
            setQuiz(quiz)
            setAnswers(answers)
            const initialNodes = mindMap.nodes
            const initialEdges = mindMap.edges
            setNodes(initialNodes)
            setEdges(initialEdges)
            setActualScreen('result')

        }catch(err){
            setActualScreen('home')
            setError("Ocurred an error: " + (err.response?.data?.detail || err.message))
        }finally{
            setLoading(false)
        }
    }

    const processRecordAudio = async (audioFile) => {
        setActualScreen('loading')
        setLoading(true)
        setError(null)
        setAbstract("")
        setNodes([])
        setEdges([])

        const formData = new FormData()
        formData.append('file', audioFile)

        try{
            const response = await api.post("/process_audio", formData)
            const {abstract, mindMap, quiz, answers} = response.data
            setAbstract(abstract)
            setShowAbstract(true)
            setQuiz(quiz)
            setAnswers(answers)
            const initialNodes = mindMap.nodes
            const initialEdges = mindMap.edges
            setNodes(initialNodes)
            setEdges(initialEdges)
            setActualScreen('result')
        }
        catch(err){
            setActualScreen('home')
            setError("Ocurred an error: " + (err.response?.data?.detail || err.message))
        }
        finally{
            setLoading(false)
        }
    }

    const HandleLeftClick = () => {
        if(showMindMap){
            setShowMindMap(false)
            setShowAbstract(true)
        }
        else if(showQuiz){
            setShowQuiz(false)
            setShowMindMap(true)
        }
        else if(showAnswers){
            setShowAnswers(false)
            setShowQuiz(true)
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    const HandleRightClick = () => {
        if(showAbstract){
            setShowAbstract(false)
            setShowMindMap(true)
        }
        else if(showMindMap){
            setShowMindMap(false)
            setShowQuiz(true)
        }
        else if(showQuiz){
            setShowQuiz(false) 
            setShowAnswers(true)
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    const handleHome = () => {
        setSelectedFile(null)
        setFileName("")
        setAbstract("")
        setShowAbstract(false)
        setActualScreen('home')
        setNodes([])
        setEdges([])
        setShowMindMap(false)
        setQuiz("")
        setShowQuiz(false)
        setAnswers("")
        setShowAnswers(false)
    }

    useEffect(() => {
        if(!loading) return

        let cont = 1

        const intervalo = setInterval(() => {
            if(cont % 3 == 0){
                setLoadingText("Criando conteúdo.")
            }
            else if(cont % 3 == 1){
                setLoadingText("Criando conteúdo..")
            }
            else{
                setLoadingText("Criando conteúdo...")
            }
            cont++
        }, 500)

        return () => clearInterval(intervalo)
    }, [loading])

    return (
        <div id="App">
            <main>
                {(actualScreen === 'home' || actualScreen === 'record') && <header>
                    <div id='titulo'>
                        <img src={mindClass_logo} alt="MindClass logo" />
                        <h1>MindClass</h1>
                    </div>
                <p>Transforme seus áudios em conteúdos estruturados. Faça o Upload de um áudio ou faça uma gravação a partir do microfone.</p>
                </header>
                }

                {actualScreen === 'home' && <div id="dropContainer">
                    <div {...getRootProps()}
                    className={`dropzone ${isDragActive ? 'dropzone-active' : ''} ${selectedFile ? 'dropzone-file' : ''}`}>
                        <input {...getInputProps()}/>

                        {selectedFile ? (
                            <div id="dropzone-content">
                                <div id='iconContainer'>🎵</div>
                                <p id='dropzone-fileName'>{fileName}</p>
                                <p id='dropzone-fileSize'>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                                id="removeButton"
                                >
                                    Trocar arquivo
                                </button>
                            </div>
                        ) : (
                            <div id='dropzone-content'>
                                <div className={`iconUpload ${isDragActive ? "textDropzone-dragOn" : ""}`}>
                                    <FiDownload />
                                </div>
                                <p className={`textDropzone ${isDragActive ? "textDropzone-dragOn" : ""}`}>
                                    {isDragActive ? "Solte o áudio aqui" : "Arraste seu áudio ou clique aqui"}
                                </p>
                                <p className={`subTextDropzone ${isDragActive ? "textDropzone-dragOn" : ""}`}>MP3, WAV ou M4A</p>
                            </div>  
                        )}
                    </div>
                </div>
                }

                {actualScreen === 'home' && <form onSubmit={submitForm}>
                    <button type='submit'>
                        Começar
                    </button>
                </form>
                }

                {actualScreen === 'home' && <div id='orLine'>
                    <div className='recordLine'></div>
                    <p>ou</p>
                    <div className='recordLine'></div>
                </div>
                }

                {actualScreen === 'home' && <div id='divButtonRecord'>
                    <button id='buttonRecord' onClick={() => setActualScreen('record')}>
                        <FaMicrophone /> Gravar Áudio
                    </button>
                </div>
                }

                {loading &&
                <div id="spinnerDiv">
                    <div className="spinner"></div>
                    <h2>{loadingText}</h2>
                </div>}
                
                {error && <div id='errorMessage'>erro: {error}</div>}

                {actualScreen === 'home' && <div id="contents-list">
                    <div className='contents-home-value'>
                        <div className='contents-img'>
                            <IoDocumentText />
                        </div>
                        <h3>Resumo</h3>
                        <p>Descrição textual do conteúdo do áudio</p>
                    </div>
                    <div className='contents-home-value'>
                        <div className='contents-img'>
                            <RiMindMap />
                        </div>
                        <h3>Mapa mental</h3>
                        <p>Estrutura visual com os principais tópicos do áudio</p>
                    </div>
                    <div className='contents-home-value'>
                        <div className='contents-img'>
                            <MdQuiz />
                        </div>
                        <h3>Quiz</h3>
                        <p>Perguntas e respostas em relação ao áudio</p>
                    </div>
                </div>
                }

                {actualScreen === 'record' && (
                    <Recorder onComeBack = {() => setActualScreen('home')} onSendAudio={processRecordAudio}/>
                )}

                {actualScreen === 'result' && <div id="resultsContainer">
                    {showAbstract && (
                        <>
                        <button id='leftI'></button>
                        <div id="abstract">
                            <div id="markdown">
                                <ReactMarkdown>{abstract}</ReactMarkdown>
                            </div>
                        </div>
                        <button id='right' onClick={HandleRightClick}>&gt;</button> 
                        </>
                    )}

                    {showMindMap && (
                        <>
                        <button id='left' onClick={HandleLeftClick}>&lt;</button> 
                        <div id="mindMap">
                            <h2>Mapa mental:</h2>
                            <div id="mindMapGenerator">
                                <ReactFlow
                                    nodes={nodes}
                                    edges={edges}
                                    onNodesChange={onNodesChange}
                                    onEdgesChange={onEdgesChange}
                                    Position
                                    fitView>
                                    <Controls />
                                    <Background variant='dots' gap={12} size={1} />
                                </ReactFlow>
                            </div>
                        </div>
                        <button id='right' onClick={HandleRightClick}>&gt;</button>
                        </> 
                    )}

                    {showQuiz && (
                        <>
                        <button id='left' onClick={HandleLeftClick}>&lt;</button> 
                        <div id="quiz">
                            <h2>Questionário:</h2>
                            <pre>{quiz}</pre>
                        </div>
                        <button id='right' onClick={HandleRightClick}>&gt;</button>
                        </>
                    )}

                    {showAnswers && (
                        <>
                        <button id='left' onClick={HandleLeftClick}>&lt;</button> 
                        <div id="answers">
                            <h2>Gabarito:</h2>
                            <pre>{answers}</pre>
                        </div>
                        <button id='rightI'></button>
                        </>
                    )}
                </div>
                }
            </main>
            {actualScreen === 'result' && <button id='Home' onClick={handleHome}>
                <TiHome size={22}/>
            </button>}
        </div>
    )
}

export default App