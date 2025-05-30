import axios from 'axios';

const apiAdoption = axios.create({
  baseURL: 'http://localhost:8090', // puerto del microservicio de ADOPTION
});

export default apiAdoption;
