import axios from 'axios';

const apiIBGE = axios.create({
    baseURL: 'https://servicodados.ibge.gov.br/api/v1'
});

export default apiIBGE;