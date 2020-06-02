import express from 'express';

const app = express();

app.get('/users', (request, response) => {
    response.json(['TESTE', 'Hello111']);
});

app.listen(3333);