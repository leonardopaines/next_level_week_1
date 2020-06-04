import axios from 'axios';

const apiColeta = axios.create({
    baseURL: 'http://localhost:3333'
});

export default apiColeta;