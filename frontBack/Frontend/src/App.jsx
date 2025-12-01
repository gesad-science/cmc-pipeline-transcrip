import React, {useState} from 'react'
import ReactMarkdown from 'react-markdown'
import ReactFlow, {
    Position,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
} from 'reactflow'
import axios from 'axios'
import 'reactflow/dist/style.css'
import logo_gesad from './assets/logo_gesad2.png';
import { TiHome } from 'react-icons/ti';

function App(){
    const [selectedFile, setSelectedFile] = useState(null)
    const [invisible, setInvisible] = useState(false)
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
    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])

    const captureFile = (event) => {
        setSelectedFile(event.target.files[0])
        setFileName(event.target.files[0].name)
    }

    const submitForm = async (event) => {
        event.preventDefault()

        if (!selectedFile){
            setError("Selecione um arquivo")
            return
        }

        setLoading(true)
        setInvisible(true)
        setError(null)
        setAbstract("")
        setNodes([])
        setEdges([])

        const formData = new FormData()
        formData.append("file", selectedFile)

        try{
            const response = await axios.post("http://confutable-marybeth-throatily.ngrok-free.dev/process_audio/", formData, {
                headers:{
                    'Content-type':'multipart/form-data'
                }
            })
            const {abstract, mindMap, quiz, answers} = response.data
            setAbstract(abstract)
            setShowAbstract(true)
            setQuiz(quiz)
            setAnswers(answers)
            const initialNodes = mindMap.nodes
            const initialEdges = mindMap.edges
            setNodes(initialNodes)
            setEdges(initialEdges)

        }catch(err){
            setInvisible(false)
            setError("Ocurred an error: " + (err.response?.data?.detail || err.message))
        }finally{
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
        setInvisible(false)
        setNodes([])
        setEdges([])
        setShowMindMap(false)
        setQuiz("")
        setShowQuiz(false)
        setAnswers("")
        setAnswers(false)
        setShowAnswers(false)
    }
    return (
        <div id="App">
            <header>
                <h1>MindClass</h1>
                <p>Criador de Resumos, Mapas Mentais e Quizes a partir de áudios</p>
            </header>
            <main>
                {!invisible && <form onSubmit={submitForm}>
                    <div id='uploadContainer'>
                        <input type="file" onChange={captureFile} accept='audio/*' id="ghostButton" className='invisibleButton'/>
                        <label htmlFor="ghostButton" id='customizedButton'>Selecione o Arquivo</label>
                        <p id='fileName'>{fileName}</p>
                    </div>
                    <button type='submit'>
                        Começar
                    </button>
                </form>
                }

                {loading && 
                <div id="spinnerDiv">
                    <div className="spinner"></div>
                    <h2>Criando conteúdo...</h2>
                </div>}
                
                {error && <div id='errorMessage'>erro: {error}</div>}

                <div id="resultsContainer">
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
            </main>
            <img src={logo_gesad} alt="Logo GESAD"/>
            <button id='Home' onClick={handleHome}>
                <TiHome size={22}/>
            </button>
        </div>
    )
}

export default App