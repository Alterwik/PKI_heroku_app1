const { Client } = require('pg');
const { google } = require('googleapis');
const express = require('express')
const OAuth2Data = require('./google_key.json')
const passport          =     require('passport')
    , FacebookStrategy  =     require('passport-facebook').Strategy;

const app = express()

const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URL = OAuth2Data.web.redirect_uris[0];

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)
var authed = false;
var loggedUser = null;
// var dataTable = new Array();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
})
client.connect();

const getUsers = (request, response) => {
    console.log('Pobieram dane ...');
    client.query('SELECT * FROM public."users"', (error, res) => {
        if (error) {
            console.log('ERROR:');
            throw error
            console.log('ERROR --- ');
        }
        console.log('Dostałem ...');
        for (let row of res.rows) {
            // dataTable.push(JSON.stringify(row));
            console.log(JSON.stringify(row));
        }
    })
}

app.get('/', (req, res) => {
    getUsers();
    var sendMsg = '<H2>PKI heroku app1</H2><br><br>'.concat(
        '<a href="/loginGoogle">login via Google account</a><br><br>',
        '<a href="/loginFacebook">login via Facebook account</a>');
    // console.log('length of datatable: ');
    // console.log(dataTable.length);
    // for (let row of dataTable) {
    //     console.log('DEBUG: '.concat(row));
    //     sendMsg.concat(row);
    // }


    client.query('SELECT * FROM public."users"', (error, res) => {
        if (error) {
            throw error
        }
        // console.log('Dostałem ...');
        sendMsg = sendMsg.concat('test1');
        for (let row of res.rows) {
            // dataTable.push(JSON.stringify(row));
            console.log('<H3>'.concat(JSON.stringify(row)).concat('</H3>'));
            sendMsg = sendMsg.concat('<H3>'.concat(JSON.stringify(row)).concat('</H3>'));
        }
        sendMsg = sendMsg.concat('test2');
    });
    console.log('----------------');
    console.log(sendMsg);
    console.log('----------------');
    res.send(sendMsg);
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
    authed = false;
    loggedUser = null;
    app.post('https://accounts.google.com/o/oauth2/revoke?token=549054502905-h2nv7bpt5u54elcci8cs3hpkna47gdpj.apps.googleusercontent.com');
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
            '<br><a href="/logoutGoogle">logout</a>'));
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
//facebook

// Passport session setup.
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

passport.use(new FacebookStrategy({
        clientID: '715138622648224',
        clientSecret:'0e1fc8e655dab2ca936e84ca4a7407a8' ,
        callbackURL: '/auth/facebook/callback'
    },
    function(accessToken, refreshToken, profile, done) {
        process.nextTick(function () {
            //Check whether the User exists or not using profile.id
            // if(config.use_database) {
            //     // if sets to true
            //     pool.query("SELECT * from user_info where user_id="+profile.id, (err,rows) => {
            //         if(err) throw err;
            //         if(rows && rows.length === 0) {
            //             console.log("There is no such user, adding now");
            //             pool.query("INSERT into user_info(user_id,user_name) VALUES('"+profile.id+"','"+profile.username+"')");
            //         } else {
            //             console.log("User already exists in database");
            //         }
            //     });
            // }
            return done(null, profile);
        });
    }
));
app.get('/loginFacebook', (req, res) => {
    if(authed){
        res.redirect('/onlyForLogged');
    }else{
        res.redirect('/auth/facebook');
    }
});

app.get('/auth/facebook', passport.authenticate('facebook',{scope:'email'}));


app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { successRedirect : '/', failureRedirect: '/login' }),
    function(req, res) {
        authed = true;
        res.redirect('/onlyForLogged');
    });

app.get('/logoutFacebook', function(req, res){
    authed = false;
    req.logout();
    res.redirect('/');
});

app.get('/account', ensureAuthenticated, function(req, res){
    res.render('account', { user: req.user });
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login')
}

const port = process.env.PORT || 5000
app.listen(port, () => console.log(`Server running at ${port}`));
