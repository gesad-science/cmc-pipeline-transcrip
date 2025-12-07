import axios from 'axios'

const api = axios.create({
    baseURL: 'https://postoperative-veda-imperforate.ngrok-free.dev',
    headers:{
        'ngrok-skip-browser-warning': 'true',
    }
})

export default api;