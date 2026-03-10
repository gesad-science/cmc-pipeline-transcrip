import React, {useEffect, useState, useRef} from 'react'
import { FaMicrophone } from "react-icons/fa";
import { CiPause1 } from "react-icons/ci";
import { FaStop } from "react-icons/fa";
import { FaPlay } from "react-icons/fa";
import { IoIosSend } from "react-icons/io";
import { FaArrowLeft } from "react-icons/fa6";
import { MdAudioFile } from 'react-icons/md';


const Recorder = ({onComeBack, onSendAudio}) => {
    const [recordStatus, setRecordStatus] = useState('idle')
    const [seconds, setSeconds] = useState(0)
    const [audioData, setAudioData] = useState(null)
    const [audioMimeType, setAudioMimeType] = useState('audio/webm')
    const [text, setText] = useState("Pronto para gravar")

    const timerRef = useRef(null)
    const canvasRef = useRef(null)
    const mediaStreamRef = useRef(null)

    const audioContextRef = useRef(null)
    const analyzerRef = useRef(null)
    const animationRef = useRef(null)

    const mediaRecorderRef = useRef(null)
    const audioChunksRef = useRef([])

    useEffect(() => {
        return () => finishAll(true)
    }, [])

    useEffect(() => {
        if (recordStatus === 'recording'){
            timerRef.current = setInterval(() => {
                setSeconds((prevSeconds) => prevSeconds + 1)
            }, 1000)
        }else{
            clearInterval(timerRef.current)
        }
        return () => clearInterval(timerRef.current)
    }, [recordStatus])

    const drawSpec = () => {
        if (!analyzerRef.current || !canvasRef.current) return

        const analyzer = analyzerRef.current
        const canvas = canvasRef.current
        const canvasCtx = canvas.getContext('2d')
        const bufferLength = analyzer.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw)
            analyzer.getByteFrequencyData(dataArray)

            canvasCtx.fillStyle = '#1e1e1e'
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height)

            const barWidth = (canvas.width / bufferLength) * 2.5
            let barHeight
            let x = 0

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i];
                canvasCtx.fillStyle = `rgb(${barHeight + 100}, 250, 0)`;
                canvasCtx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
                x += barWidth + 1;
            }
        }

        draw()
    }

    const startRecord = async () => {
        try{
            const audioContext = window.AudioContext || window.webkitAudioContext 
            const audioCtx = new audioContext()
            audioContextRef.current = audioCtx

            const stream = await navigator.mediaDevices.getUserMedia({ audio : true })
            mediaStreamRef.current = stream

            audioChunksRef.current = []
            setAudioData(null)
            setSeconds(0)

            const analyzer = audioCtx.createAnalyser()
            analyzer.fftSize = 256
            analyzerRef.current = analyzer

            const source = audioCtx.createMediaStreamSource(stream)
            source.connect(analyzer)

            if(audioCtx.state === 'suspended'){
                await audioCtx.resume()
            }
            drawSpec()

            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0){
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type : mediaRecorder.mimeType || 'audio/webm'})
                setAudioMimeType(audioBlob.type)

                const reader = new FileReader()
                reader.readAsDataURL(audioBlob)
                reader.onloadend = () => {
                    const result = reader.result
                    if (result && result.includes(',')){
                        const base64Data = reader.result.split(',')[1]
                        setAudioData(base64Data)
                    }
                }

                if (mediaStreamRef.current){
                    mediaStreamRef.current.getTracks().forEach((track) => track.stop())
                    mediaStreamRef.current = null
                }
            }

        mediaRecorder.start()
        setText("Gravando")
        setRecordStatus('recording')
        }catch(err){
            console.error("Error in start recording:", err)
            alert("Permissão de microfone negada ou erro no dispositivo!")
        }
    }

    const pauseRecord = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording'){
            mediaRecorderRef.current.pause()
        }
        if (animationRef.current) cancelAnimationFrame(animationRef.current)
        setRecordStatus('paused')
        setText('Pausado')
    }

    const continueRecord = async () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused'){
            mediaRecorderRef.current.resume()
        }
        drawSpec()
        setText('Gravando')
        setRecordStatus('recording')
    }

    const finishRecord = () => {
        setText("Gravação Concluída")
        setRecordStatus('finished')
        finishAll(false)
    }

    const finishAll = (isCleanUp = false) => {
        clearInterval(timerRef.current)

        if (animationRef.current){
            cancelAnimationFrame(animationRef.current)
            animationRef.current = null
        } 

        if (audioContextRef.current && audioContextRef.current.state !== 'closed'){
             audioContextRef.current.close()
             audioContextRef.current = null
        }
        
        if (canvasRef.current){
            const canvasCtx = canvasRef.current.getContext('2d')
            canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        }

        if (isCleanUp){
            setAudioData(null)
            audioChunksRef.current = []
            if (mediaStreamRef.current){
                mediaStreamRef.current.getTracks().forEach((track) => track.stop())
                mediaStreamRef.current = null
            }
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive'){
            mediaRecorderRef.current.stop()
        }
    }

    const discardRecord = () => {
        setRecordStatus('idle')
        setSeconds(0)
        setText('Pronto para Gravar')
    }

    const timeFormat = (total) => {
        const min = Math.floor(total/60)
        const seg = total % 60
        return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
    }

    const base64ToFile = (base64String) => {
        const byteCharacters = atob(base64String)
        const byteNumbers = new Array(byteCharacters.length)

        for (let i = 0; i < byteCharacters.length; i++){
            byteNumbers[i] = byteCharacters.charCodeAt(i)
        }

        const byteArray = new Uint8Array(byteNumbers)

        const blob = new Blob([byteArray], { type : audioMimeType})
        const extension = audioMimeType.includes('mp4') ? '.mp4' : '.webm'
        return new File([blob], `gravacao_mindclass${extension}`, { type : audioMimeType})
    }

    const handleSendAudio = () => {
        if (!audioData) return

        const audioFile = base64ToFile(audioData)
        onSendAudio(audioFile)
    }

    const handleToHome = async () => {
        finishAll(true)
        onComeBack()
    }

    return (
        <div id="recorderMain">
            <div id='recorderContainer'>
                <div id="timer">
                    {timeFormat(seconds)}
                </div>
                <p id='recordStatusText'>{text}</p>

                {(recordStatus === 'recording' || recordStatus === 'paused' || recordStatus === 'idle') && <canvas id='canvasRef' ref={canvasRef}/>}

                {(recordStatus === 'finished' && audioData) && <audio
                controls
                src={`data:audio/aac; base64, ${audioData}`}
                style={{width : '100%', outline : 'none'}}
                >
                Seu navegador não suporta o elemento áudio!
                </audio>}

                <div id="recordButtons">
                    {recordStatus === 'idle' && <button id='startRecordButton' className='buttonsActive' onClick={startRecord}><FaMicrophone /></button>}

                    {recordStatus === 'recording' && <button id='pauseRecordButton' className='buttonsActive' onClick={pauseRecord}><CiPause1 /></button>}

                    {recordStatus === 'recording' && <button id='finishRecordButton' className='buttonsActive' onClick={finishRecord}><FaStop /></button>}

                    {recordStatus === 'paused' && <button id='continueRecordButton' className='buttonsActive' onClick={continueRecord}><FaPlay /></button>}

                    {recordStatus === 'paused' && <button id='finishRecordButton' className='buttonsActive' onClick={finishRecord}><FaStop /></button>}

                    {recordStatus === 'finished' && <button id='discardRecordButton' className='buttonsActive' onClick={discardRecord}><FaArrowLeft size={20}/> Descartar Áudio</button>}

                    {recordStatus === 'finished' && <button id='sendToLLMButton' className='buttonsActive' onClick={handleSendAudio}><IoIosSend size={25}/> Enviar Áudio</button>}
                </div>
            </div>

            <button id='recordToHomeButton' className='buttonsActive' onClick={handleToHome}><FaArrowLeft size={20}/> Voltar para a área de upload</button>
        </div>
    )
}
export default Recorder;