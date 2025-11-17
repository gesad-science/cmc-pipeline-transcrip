import React, {useState} from 'react'
import ReactMarkdown from 'react-markdown'
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
} from 'reactflow'
import axios from 'axios'
import 'reactflow/dist/style.css'

function App(){
    const [selectedFile, setSelectedFile] = useState(null)
    const [abstract, setAbstract] = useState("")
    const [quiz, setQuiz] = useState("")
    const [answers, setAnswers] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])

    const captureFile = (event) => {
        setSelectedFile(event.target.files[0])
    }

    const submitForm = async (event) => {
        event.preventDefault()

        if (!selectedFile){
            setError("Selecione um arquivo")
            return
        }

        setLoading(true)
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
            setQuiz(quiz)
            setAnswers(answers)
            const initialNodes = mindMap.nodes
            const initialEdges = mindMap.edges
            setNodes(initialNodes)
            setEdges(initialEdges)

        }catch(err){
            setError("Ocurred an error: " + (err.response?.data?.detail || err.message))
        }finally{
            setLoading(false)
        }
    }
    return (
        <div id="App">
            <header>
                <h1>Gerador de Resumo, Mapa Mental e Perguntas</h1>
                <p>Envie um arquivo de áudio (.mp3, .wav, etc.)</p>
            </header>
            <main>
                <form onSubmit={submitForm}>
                    <input type="file" onChange={captureFile} accept='audio/*'/>
                    <button type='submit' disabled={loading}>
                        {loading ? "Processando..." : "Gerar"}
                    </button>
                </form>
                
                {error && <div id='errorMessage'>erro: {error}</div>}

                {abstract && (
                    <div id="resultsContainer">
                        <div id="abstract">
                            <div id="markdown">
                                <ReactMarkdown>{abstract}</ReactMarkdown>
                            </div>
                        </div>

                        {nodes.length > 0 && (
                            <div id="mindMap">
                                <h2>Mapa mental:</h2>
                                <div id="mindMapGenerator">
                                    <ReactFlow 
                                    nodes={nodes} 
                                    edges={edges} 
                                    onNodesChange={onNodesChange} 
                                    onEdgesChange={onEdgesChange}
                                    fitView>
                                        <Controls/>
                                        <MiniMap/>
                                        <Background variant='dots' gap={12} size={1}/>
                                    </ReactFlow>
                                </div>
                            </div>
                        )}

                        {quiz && (
                            <div id="quiz">
                                <h2>Questionário:</h2>
                                <pre>{quiz}</pre>
                            </div>
                        )}

                        {answers && (
                            <div id="answers">
                                <h2>Gabarito:</h2>
                                <pre>{answers}</pre>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}

export default App