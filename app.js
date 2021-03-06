/*jshint esversion: 11 */
require('dotenv').config();
const request = require('request');
const mysql = require('mysql');
const express = require('express');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const NewsAPI = require('newsapi');
const email_validator = require("email-validator");
const sha256 = require('sha256');
const newsapi = new NewsAPI(process.env.NEWS);
const weather = require('openweather-apis');
const generator = require('generate-password');
weather.setLang('en');
weather.setAPPID(process.env.WEATHER);
const querystring = require('querystring');
const app = express();
app.disable('x-powered-by');
app.set('trust proxy',true); 
var rawBodySaver = function (req, res, buf, encoding) {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
};
app.use(bodyParser.json({ verify: rawBodySaver, limit:'50mb' }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ verify: rawBodySaver, extended: true, limit:'50mb' }));
app.use(bodyParser.raw({ verify: rawBodySaver, type: '*/*', limit:'50mb' }));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

app.listen(8000, '0.0.0.0', () => {
    console.log(`Webserver running on port 8000.`);
});

app.get('/background', (req, res) => {
    res.sendFile('images/background.jpeg', {root: '.'});
});

app.get('/api/news', (req, res) => {
    if(!req.query.country) res.status(400).json({success:false, reason:"No country provided."});
    newsapi.v2.topHeadlines({
        country: req.query.country
      }).then(response => {
        res.json({success:true, data: response});
      });
});




app.get('/api/weather', (req, res) => {
    if(!req.query.city) res.status(400).json({success:false, reason:"No city provided."});
    try {
        weather.setCity(req.query.city);
        weather.getAllWeather((err, data) => {
            if(err) {
                console.log(err);
                return res.json({success:false, reason: `${err}`});
            } else {
                return res.json({success:true, data:data});
            }
        });
    } catch(err) {
        return res.json({success:false, reason: `${err}`});
    }

    

});

app.post('/api/remove-staff', (req, res) => {
    var email = req.body.email;
    var manager_token = req.cookies.token;

    if(!manager_token) return res.json({success:false, reason:"Unauthorised. Try logging out and logging back in."});
    if(!email) return res.json({success:false, reason: "Missing data"});

    var con = db_connection();
    con.connect(function(err) {
        if(err) {
            console.log(err);
            return res.json({success:false, reason: "Database error. Please retry."});
        } else {
            con.query(`DELETE FROM staff WHERE email = ${mysql.escape(email)} AND manager = (SELECT managerID FROM manager WHERE token = ${mysql.escape(manager_token)});`, (err, result) => {
                con.end();
                if(err) {
                    console.log(err);
                    return res.json({success:false, reason:"Database error. Please retry."});
                } else {
                    if(result.affectedRows == 1) {
                        res.json({success:true});
                    } else {
                        res.json({success:false, reason:"This action was unsuccessful. Please check that the staff member is added."});
                    }
                }
            });
        }
    });
});

app.post('/api/add-staff', (req, res) => {
    var email = req.body.email;
    var name = req.body.name;
    var city = req.body.city;
    var country = req.body.country;
    var manager_token = req.cookies.token;

    if(!manager_token) return res.json({success:false, reason:"Unauthorised. Try logging out and logging back in."});
    if(!email || !name || !city || !country) return res.json({success:false, reason: "Missing data"});
    if(!email_validator.validate(email)) return res.json({success:false, reason: "The email address provided is invalid.", field:"email"});

    var con = db_connection();
    con.connect(function(err) {
        if(err) {
            console.log(err);
            return res.json({success:false, reason: "Database error. Please retry."});
        } else {
            con.query(`INSERT INTO staff (email, name, city, country, manager) VALUES (${mysql.escape(email)}, ${mysql.escape(name)}, ${mysql.escape(city)}, ${mysql.escape(country)}, (SELECT managerID FROM manager WHERE token = ${mysql.escape(manager_token)}));;`, (err, result) => {
                con.end();
                if(err) {
                    console.log(err);
                    return res.json({success:false, reason:"Database error. Please retry."});
                } else {
                    if(result.affectedRows == 1) {
                        res.json({success:true});
                    } else {
                        res.json({success:false, reason:"This action was unsuccessful. Please check that this email isn't already added."});
                    }
                }
            });
        }
    });


});

app.post('/api/register', (req, res) => {
    var email = req.body.email;
    var forename = req.body.forename;
    var password = req.body.password;

    if(!email || !forename || !password) return res.json({success:false, reason: "Missing data"});
    if(!email_validator.validate(email)) return res.json({success:false, reason: "The email address provided is invalid.", field:"email"});

    var con = db_connection();
    con.connect(function(err) {
        if(err) {
            console.log(err);
            return res.json({success:false, reason: "Database error. Please retry."});
        } else {
            con.query(`SELECT * FROM staff, manager WHERE staff.email = ${mysql.escape(email)} OR manager.email = ${mysql.escape(email)};`, (err, result) => {
                if(err) {
                    console.log(err);
                    con.end().catch(() => console.log(""));
                    return res.json({success:false, reason: "Database error. Please retry." });
                } else {
                    if(result.length >= 1) {
                        con.end();
                        return res.json({success:false, reason: "This email is already in use. Please retry with another one.", field: "email"});
                    } else {
                        var token = generator.generate({
                            length: 50,
                            numbers: true,
                            lowercase:false
                       });
                       // unlikely to be in db but worth a check.
                       con.query(`SELECT token FROM manager WHERE token = ${mysql.escape(token)}`, (err, result) => {
                        if(err) {
                            console.log(err);
                            con.end().catch(() => console.log(""));
                            return res.json({success:false, reason: "Database error. Please retry."});
                        } else {
                            if(result.length == 0) {
                                con.query(`INSERT INTO manager (email, forename, password, token) VALUES (${mysql.escape(email)}, ${mysql.escape(forename)}, ${mysql.escape(sha256(password))}, ${mysql.escape(token)});`, (err, result) => {
                                    if(err) {
                                        console.log(err);
                                        con.end().catch(() => console.log(""));
                                        return res.json({success:false, reason: "Database error. Please retry."});
                                    } else {
                                        con.end();
                                        if(result.affectedRows == 1) {
                                            return res.json({success:true, token:token});
                                        } else {
                                            return res.json({success:false, reason:"An error has occurred. Please retry."});
                                        }
                                    }
                                });
                            } else {
                                return res.json({success:false, reason:"Token already exists. Please retry. Contact support if this persists."});
                            }
                            
                        }
                       });
                    
                    }   
                }
            });
        }
        
        
    });

});

app.post("/api/login", (req, res) => {
    var email = req.body.email;
    var password = req.body.password;

    if(!email || !password) return res.json({success:false, reason: "Missing data"});

    var con = db_connection();
    con.connect(function(err) {
        if(err) {
            console.log(err);
            return res.json({success:false, reason: "Database error. Please retry."});
        } else {
            con.query(`SELECT token FROM manager WHERE email = ${mysql.escape(email)} AND password = ${mysql.escape(sha256(password))};`, (err, result) => {
                if(err) {
                    console.log(err);
                    con.end().catch(() => console.log(""));
                    return res.json({success:false, reason: "Database error. Please retry." });
                } else {
                    con.end();
                    if(result.length == 1) {
                        res.json({success:true, token:result[0].token});
                    } else {
                        res.json({success:false, reason: "Your email or password is incorrect."});
                    }
                }
            });
        }
    });                    
});

app.get('/', (req, res) => {
    if(req.cookies) {
        if (req.cookies.token) {
            var con = db_connection();
            con.connect(function(err) {
                if(err) {
                    console.log(err);
                    res.sendFile('index.html', {root:'.'});
                    //return res.render('error.ejs', {theme: req.cookies.theme, msg: "Database error. Please try again later."});
                } else {
                    con.query(`SELECT * FROM manager WHERE token = ${mysql.escape(req.cookies.token)};`, (err, result) => {
                        if(err) {
                            console.log(err);
                            con.end().catch(() => console.log(""));
                            res.sendFile('index.html', {root:'.'});
                            //return res.render('error.ejs', {theme: req.cookies.theme, msg: "Database error. Please try again later."});
                        } else {
                            con.end();
                            if(result.length == 1) {
                                return res.redirect('/dashboard');
                            } else {
                                res.sendFile('index.html', {root:'.'});
                            }
                        }
                    });
                }
            });
        } else {
            res.sendFile('index.html', {root:'.'});
        }
    } else {
        res.sendFile('index.html', {root:'.'});
    }
    
});

app.get('/dashboard', (req, res) => {
    if(!req.cookies.token) return res.redirect('/');
    if(!req.cookies.theme) req.cookies.theme = 'standard';
    
    var con = db_connection();
    con.connect(function(err) {
        if(err) {
            console.log(err);
            return res.render('error.ejs', {theme: req.cookies.theme, msg: "Database error. Please try again later."});
        } else {
            con.query(`SELECT * FROM manager WHERE token = ${mysql.escape(req.cookies.token)};`, (err, result) => {
                if(err) {
                    console.log(err);
                    con.end().catch(() => console.log(""));
                    return res.render('error.ejs', {theme: req.cookies.theme, msg: "Database error. Please try again later."});
                } else {
                    
                    if(result.length == 1) {
                        con.query(`SELECT * FROM staff WHERE manager = ${result[0].managerID};`, (err, result2) => {
                            con.end();
                            if(err) {
                                console.log(err);
                                return res.render('error.ejs', {theme: req.cookies.theme, msg: "Database error. Please try again later."});
                            } else {
                                res.render('dashboard.ejs', {theme: req.cookies.theme, userdata: result[0], staff:result2});
                            }
                        });
                        
                    } else {
                        con.end();
                        res.render('error.ejs', {theme: req.cookies.theme, msg: "Your token is invalid. Please try logging in again."});
                    }
                }
            });
        }
    });

});

function db_connection() {
    return mysql.createConnection({
        host: 'dukedan.uk',
        user: process.env.DB,
        password: process.env.DBPASS,
        database: process.env.DB
    });
}
