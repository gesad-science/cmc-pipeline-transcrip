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
import { use } from 'react'

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
            const response = await axios.post("/api/process_audio/", formData, {
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

    const abstractButton = () =>{
        setShowAbstract(true)
    }

    const mindMapButton = () =>{
        setShowMindMap(true)
    }

    const quizButton = () =>{
        setShowQuiz(true)
    }
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
                        Gerar
                    </button>
                </form>
                }

                {loading && 
                <div id="spinnerDiv">
                    <div className="spinner"></div>
                    <h2>Gerando conteúdo...</h2>
                </div>}
                
                {error && <div id='errorMessage'>erro: {error}</div>}

                <div id="resultsContainer">
                    {!showAbstract && (
                        <div id="abstract">
                            <div id="markdown">
                                <ReactMarkdown>{abstract}</ReactMarkdown>
                            </div>
                        </div>
                    )}

                    {showMindMap && (
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
                                    <Controls/>
                                    <Background variant='dots' gap={12} size={1}/>
                                </ReactFlow>
                            </div>
                        </div>
                    )}

                    {showQuiz && (
                        <div id="quiz">
                            <h2>Questionário:</h2>
                            <pre>{quiz}</pre>
                        </div>
                    )}

                    {true && (
                        <div id="answers">
                            <h2>Gabarito:</h2>
                            <pre>{answers}</pre>
                        </div>
                    )}
                </div>
            </main>
            <img src={logo_gesad} alt="Logo GESAD"/>
        </div>
    )
}

export default App