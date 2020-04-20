const { google } = require('googleapis');
const express = require('express')
const OAuth2Data = require('./google_key.json')

const app = express()

const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URL = OAuth2Data.web.redirect_uris[0];

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)
var authed = false;

app.get('/', (req, res) => {
    res.send('<a href="/loginGoogle">login via Google account</a>');
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
                loggedUser = result.data.name;
                console.log(loggedUser);
            }
        res.send('Logged in: '.concat(loggedUser, '<img src="', result.data.picture, '"height="23" width="23">',
            '<br>',
            '<br>1----------------------------|<br>',
            '<script type="text/javascript" src="https://mail.google.com/mail/u/0/?logout&hl=en" />',
            '<img src="https://mail.google.com/mail/u/0/?logout&hl=en" />',
            'window.location = "https://mail.google.com/mail/u/0/?logout&hl=en";',
            '<br>1----------------------------',
            '<br>',
            '<html>',
            '<head>',
            '   <meta name="google-signin-client_id" content="549054502905-h2nv7bpt5u54elcci8cs3hpkna47gdpj.apps.googleusercontent.com">',
            '</head>',
            '<body>',
            '  <script>',
            '    function signOut() {',
            '      var auth2 = gapi.auth2.getAuthInstance();',
            '      auth2.signOut().then(function () {',
            '        console.log(\'User signed out.\');',
            '      });',
            '      auth2.disconnect()',
            '    }',
            '    function onLoad() {',
            '      gapi.load(\'auth2\', function() {',
            '        gapi.auth2.init();',
            '      });',
            '    }',
            '  </script>',
            '  <a href="#" onclick="signOut();">Sign out 2</a>',
            '  <script src="https://apis.google.com/js/platform.js?onload=onLoad" async defer></script>',
            '</body>',
            '</html>'

// var auth2 = gapi.auth2.getAuthInstance();
// auth2.signOut().then(function () {
// });
// auth2.disconnect();

            // '<script src="https://apis.google.com/js/platform.js" async defer></script>',
            // '<a href="#" onclick="signOut();">Sign out</a>',
            // '<script>',
            // '  function signOut() {',
            // '    var auth2 = gapi.auth2.getAuthInstance();',
            // '    auth2.signOut().then(function () {',
            // '      console.log(\'User signed out.\');',
            // '    });',
            // '  }',
            // '</script>'


            ))
        // res.send('Logged in: '.concat(loggedUser, '<img src="', result.data.picture, '"height="23" width="23">',
        //  '<br><br><a href="/logoutGoogle">logout</a>'))
        });
    }
});

// app.get('/logoutGoogle', (req, res) => {
//     oAuth2Client.signOut().then(function () {
//     console.log('User signed out.');
//     authed = false;
//     res.redirect('/')
//     });
// });


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