const express = require('express')
const fetch = require('node-fetch');
const cors = require('cors')
const server = express()
const port = 8081
const api_key = '52f8f9af79e0664f928042deb0e2b888'
const bodyParser = require('body-parser')

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

const pg = require('pg');

const config = {
    host: 'localhost',
    user: 'postgres',
    password: '123654',
    database: 'favourites',
    port: 8080
};

const client = new pg.Client(config);
client.connect();

server.use(cors())

server.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');
    res.setHeader('Accept-Charset', 'utf-8')
    next();
});


// http://localhost:8080/weather/city?city=Moscow
server.get('/weather/city', (req, res) => {
    let city = req.query.q;
    city = encodeURI(city);
    const url = 'https://api.openweathermap.org/data/2.5/weather?q=' + city + '&units=metric' + '&appid=' + api_key;
    fetch(url).then(function (resp) {
        if (resp.status === 200) {
            return resp.json()
        } else {
            return 404
        }
    }).then(function (data) {
        res.send(data)
    })
})

server.get('/weather/coordinates', (req, res) => {
    let lat = req.query.lat;
    let lon = req.query.lon;
    fetch('https://api.openweathermap.org/data/2.5/weather?lat=' + lat + '&lon=' + lon + '&units=metric' + '&appid=' + api_key)
        .then(function (resp) {
            return resp.json()
        })
        .then(function (data) {
            res.send(data)
        })
})

server.get('/favourites', (req, res) => {

    const query = 'SELECT * FROM \"cities\"';

    client.query(query)
        .then(data => {
            let cities_data = data.rows;
            console.log(cities_data.length)
            let cities = []
            for (let i = 0; i < cities_data.length; i++) {
                cities.push(cities_data[i].city_name)
                console.log(cities[cities.length - 1])
            }
            res.send({cities});
        })
        .catch(err => {
            res.sendStatus(503);
        });
})

server.post('/favourites', (req, res) => {
    let city_name = req.body.name;
    let textType = typeof city_name;

    res.setHeader('Content-Type', `text/${textType}; charset=UTF-8`)

    let query = "INSERT INTO \"cities\" (city_name) VALUES ('"+ city_name + "')";
    client.query(query)
        .then(() => {
            res.sendStatus(200);
        })
        .catch(err => {
            res.sendStatus(400);
        });
})

server.options('*', (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS, POST');
    res.send('ok');
});

server.delete('/favourites', (req, res) => {
    let city_name = req.body.name;
    let query = 'DELETE FROM \"cities\" WHERE city_name=\'' + city_name + '\'';

    client
        .query(query)
        .then(result => {
            res.send(city_name + ' deleted');
        })
        .catch(err => {
            res.sendStatus(400);
            console.log(err);
            throw err;
        });


});

server.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
})