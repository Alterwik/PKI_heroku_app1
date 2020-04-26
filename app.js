const { google } = require('googleapis');
const express = require('express')
const OAuth2Data = require('./google_key.json')

const app = express()

const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URL = OAuth2Data.web.redirect_uris[0];

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)
var authed = false;
var loggedUser = null;

app.get('/', (req, res) => {
    res.send('<H2>PKI heroku app1</H2><br><br>'.concat(
        '<a href="/loginGoogle">login via Google account</a>'));
});

app.get('/loginGoogle', (req, res) => {
    if (!authed) {
        // Generate an OAuth URL and redirect there
        const url = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: 'https://www.googleapis.com/auth/userinfo.profile'
        });
        console.log(url)
        res.redirect(url);
    } else {
        var oauth2 = google.oauth2({ auth: oAuth2Client, version: 'v2' });
        oauth2.userinfo.v2.me.get(function(err, result) {
           if (err) {
                console.log('Niestety BŁĄD!!');
                console.log(err);
            } else {
                loggedUser = result.data;
                console.log(loggedUser.name);
            }
            res.redirect('/onlyForLogged');
        });
    }
});

app.get('/logoutGoogle', (req, res) => {
    res.send('<a href="/https://accounts.google.com/o/oauth2/revoke?' +
        'token=549054502905-h2nv7bpt5u54elcci8cs3hpkna47gdpj.apps.googleusercontent.com?' +
        'continue=https://pki-app1.herokuapp.com/">logout</a>');
    req.logout();
    app.post('https://accounts.google.com/o/oauth2/revoke?token=549054502905-h2nv7bpt5u54elcci8cs3hpkna47gdpj.apps.googleusercontent.com');
    authed = false;
    loggedUser = null;
    res.redirect('/');
});

app.get('/onlyForLogged', (req, res) => {
    if (authed) {
        console.log('authorised user in onlyForLogged');
        let accountLogoutUrl = "https://www.google.com/accounts/Logout" +
            "?continue=https://appengine.google.com/_ah/logout" +
            "?continue=https://pki-app1.herokuapp.com/";
        res.send('Logged in: '.concat(loggedUser.name, '<img src="', loggedUser.picture, '"height="23" width="23">',
            '<br><br><a href="',accountLogoutUrl,'">logout from google account</a>',
            '<br><a href="/">logout</a>'));
    } else {
        console.log('unauthorized user try to reach onlyForLogged');
        res.redirect('/')
    }
});

app.get('/auth/google/callback', function (req, res) {
    const code = req.query.code
    if (code) {
        // Get an access token based on our OAuth code
        oAuth2Client.getToken(code, function (err, tokens) {
            if (err) {
                console.log('Error authenticating')
                console.log(err);
            } else {
                console.log('Successfully authenticated');
                oAuth2Client.setCredentials(tokens);
                authed = true;
                res.redirect('/')
            }
        });
    }
});

const port = process.env.PORT || 5000
app.listen(port, () => console.log(`Server running at ${port}`));
