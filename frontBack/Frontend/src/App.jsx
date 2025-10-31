import React, {useState} from 'react'
import ReactFlow, {
    Minimap,
    Controls,
    Background,
    useNodesStage,
    useEdgesStage,
} from 'reactflow'
import axios from 'axios'
import 'reactflow/dist/style.css'
import '/App.css'

function App(){
    const [selectedFile, setSelectedFile] = useState(null)
    const [abstract, setAbstract] = useState("")
    const [loading, setLoading] = useState(False)
    const [error, setError] = useState(null)
    const [nodes, setNodes, onNodesChange] = useNodesStage([])
    const [edges, setEdges, onEdgesChange] = useEdgesStage([])
}
