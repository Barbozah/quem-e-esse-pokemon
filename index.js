var bodyParser = require('body-parser')
const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const scores = require('./public/scores.json')

const app = express()

app.use(express.static('.'));

app.use(bodyParser.json());

app.use(cors())

app.listen(3000, () => 
	console.log('Servidor iniciado na porta 3000')
);

app.get('/', (_, res) => 
    res.sendFile(path.join(__dirname, '/index.html'))
);

app.get('/scores', (_, res) => {
    res.send(JSON.stringify(scores));
});

app.post('/scores', (req, res) => {
    fs.writeFile("public/scores.json", JSON.stringify(req.body), function(err) {
        if (err) throw err;
        Object.assign(scores, req.body);
        console.log('scores stored');
        }
    );
    res.status(200).send('scores stored');
})