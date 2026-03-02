import React, {useEffect, useState, useRef} from 'react'
import {VoiceRecorder} from 'capacitor-voice-recorder'
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
    const [text, setText] = useState("Pronto para gravar")

    const timerRef = useRef(null)
    const canvasRef = useRef(null)
    const audioContextRef = useRef(null)
    const analyzerRef = useRef(null)
    const mediaStreamRef = useRef(null)
    const animationRef = useRef(null)

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

    const startSetupWebAudio = async () => {
        try{
            const stream = await navigator.mediaDevices.getUserMedia({audio : true})
            mediaStreamRef.current = stream

            const audioContext = window.AudioContext || window.webkitAudioContext
            const audioCtx = new audioContext()
            audioContextRef.current = audioCtx

            const analyzer = audioCtx.createAnalyser()
            analyzer.fftSize = 256
            analyzerRef.current = analyzer

            const source = audioCtx.createMediaStreamSource(stream)
            source.connect(analyzer)

            drawSpec()
        }catch(err){
            console.error("Error in web audio:", err)
        }
    }

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
            const canRecord = await VoiceRecorder.canDeviceVoiceRecord()
            if(!canRecord.value){
                return alert("Dispositivo nãao suporta gravação!")
            }

            const permission = await VoiceRecorder.requestAudioRecordingPermission()
            if(!permission.value){
                return alert("Permissão Negada!")
            }

            setSeconds(0)
            setAudioData(null)
            await VoiceRecorder.startRecording()
            await startSetupWebAudio()
            setRecordStatus('recording')
            setText("Gravando")
        }catch(err){
            console.error("Error in start recording:", err)
        }
    }

    const pauseRecord = async () => {
        try{
            setText("Pausado")
            await VoiceRecorder.pauseRecording()
            if (animationRef.current){
                cancelAnimationFrame(animationRef.current)
            }

            if (canvasRef.current) {
                const canvasCtx = canvasRef.current.getContext('2d');
                canvasCtx.fillStyle = '#1e1e1e';
                canvasCtx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
            setRecordStatus('paused')
        }catch(err){
            console.error("Error in pause record: ", err)
        }
    }

    const continueRecord = async () => {
        try{
            setText("Gravando")
            await VoiceRecorder.resumeRecording()

            drawSpec()

            setRecordStatus('recording')
        }catch(err){
            console.error("Error in continue record: ", err)
        }
    }

    const finishRecord = async () => {
        setText("Gravação Concluída")
        setRecordStatus('finished')
        await finishAll(false)
    }

    const finishAll = async (isCleanUp = false) => {
        clearInterval(timerRef.current)

        if (animationRef.current) cancelAnimationFrame(animationRef.current)
        if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach((track) => track.stop())
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') audioContextRef.current.close()
        
        if (canvasRef.current){
            const canvasCtx = canvasRef.current.getContext('2d')
            canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        }

        if (!isCleanUp){
            try{
                const result = await VoiceRecorder.stopRecording()
                setAudioData(result.value.recordDataBase64)
            }catch(err){
                console.log("Recording already stopped or error: ", err)
            }
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

    const base64ToFile = (base64String, fileName) => {
        const byteCharacters = atob(base64String)
        const byteNumbers = new Array(byteCharacters.length)

        for (let i = 0; i < byteCharacters.length; i++){
            byteNumbers[i] = byteCharacters.charCodeAt(i)
        }

        const byteArray = new Uint8Array(byteNumbers)

        const blob = new Blob([byteArray], { type : 'audio/m4a'})
        return new File([blob], fileName, { type : 'audio/m4a'})
    }

    const handleSendAudio = () => {
        if (!audioData) return

        const audioFile = base64ToFile(audioData, "mindclass_record.m4a")
        onSendAudio(audioFile)
    }

    return (
        <div id='recorderContainer'>
            <div id="timer">
                {timeFormat(seconds)}
            </div>
            <p id='recordStatusText'>{text}</p>

            <canvas id='canvasRef' ref={canvasRef}/>

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
    )
}
export default Recorder;