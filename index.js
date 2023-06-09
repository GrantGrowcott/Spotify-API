require('dotenv').config();
const axios = require('axios');
const express = require('express');
const app = express();
const port = 8888;
const querystring = require('querystring');
CLIENT_ID = process.env.CLIENT_ID;
CLIENT_SECRET = process.env.CLIENT_SECRET;
REDIRECT_URI = process.env.REDIRECT_URI;


app.get('/', (req, res) => {
    const data = {
        name: "Grint",
        isAwesome: true
    }

    res.json(data);
});


/** 
 *Generates a random string containing numbers and letters 
 * @param {number} length The length of the string
 * @return {string} The generated string
 */ 

 const generatesRandomString = (length) => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
 }

 const stateKey ='spotify_auth_state';



app.get('/login', (req, res) => {
    const state = generatesRandomString(16);
    res.cookie(stateKey, state);


    const scope =[
        'user-read-private',
        'user-read-email',
        'user-top-read'
        ].join(' ');

    const queryParams = querystring.stringify({ 
        client_id: CLIENT_ID,
        response_type: 'code',
        redirect_uri: REDIRECT_URI,
        state: state,
        scope: scope,
    })



    res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
})

// Requesting the Access Token
app.get('/callback', (req, res) => {
    const code = req.query.code || null;

    axios({
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        data: querystring.stringify({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
        }),
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${new Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
        },
    })
    .then(response => {
        if (response.status === 200) {

            const {access_token, refresh_token, expires_in} = response.data;

            const queryParams = querystring.stringify({
                 access_token,
                 refresh_token,
                 expires_in,
            })

            // redirect to react app
            res.redirect(`http://localhost:3000/?${queryParams}`)
            // pass along token to query params




        } else {
            res.redirect(`/?${querystring.stringify({error:"invalid_token"})}`);
        }
    })
    .catch(error => {
        res.send(error);
    });
})



app.get('/refresh_token', (req, res) => {
    const { refresh_token} = req.query;

    axios({
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        data: querystring.stringify({
            grant_type:'refresh_token',
            refresh_token: refresh_token
        }),
        headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${new Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
                },
    })
    .then(response => {
        res.send(response.data);
    })
    .catch(error => {
        res.send(error);
    });
});




app.listen(port, () => {
    console.log(`Express app listening on port ${port}`);
});





