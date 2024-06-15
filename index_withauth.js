const express = require('express');
const routes = require('./routes/users.js');
const jwt = require('jsonwebtoken');
const session = require('express-session')
const bcrypt = require('bcryptjs');

const mysql = require('mysql2');

const request = require('supertest');
const { expect } = require('chai');

const app = express();
const PORT =5000;

app.use(session({secret:"fingerpint",resave: true, saveUninitialized: true}))

app.use(express.json());

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'learner', 
    password: 'pwd123', 
    database: 'user_auth'
});
connection.connect(err => {
    if (err) throw err;
    console.log('Connected to MySQL database');
});

const authenticatedUser = (username,password)=>{
 let validusers = users.filter((user)=>{
    return (user.username === username && user.password === password)
 });
    if(validusers.length > 0){
        return true;
    } else {
        return false;
    }
}

const doesExist = (username, callback) => {
    const query = 'SELECT * FROM Users WHERE username = ?';
    connection.query(query, [username], (err, results) => {
        if (err) return callback(err, null);
        if (results.length > 0) return callback(null, true);
        return callback(null, false);
    });
};
    
    

app.use("/user",(req,res,next)=>{

   if(req.session.authorization) {
       let token = req.session.authorization['accessToken'];
       
       jwt.verify(token, "access",(err,user)=>{
           if(!err){
               req.user = user;
               next();
           }
           else{
               return res.status(403).json({message: "User not authenticated"})
           }
        });
    } else {
        return res.status(403).json({message: "User not logged in"})
    }
});

app.use("/user", routes);

app.post("/register", (req,res) => {
 const username = req.body.username;
 const password = req.body.password;
 const email = req.body.email;
        if (username && password && email) {
            doesExist(username, (err, exists) => {
                if (err) {
                    return res.status(500).json({ message: 'Database error' });
                }
                if (exists) {
                    return res.status(404).json({ message: 'User already exists!' });
                }
    
                // Hash the password
                const hashedPassword = bcrypt.hashSync(password, 10);
    
                const query = 'INSERT INTO Users (username, email, password) VALUES (?, ?, ?)';
                connection.query(query, [username, email, hashedPassword], (err, results) => {
                    if (err) {
                        return res.status(500).json({ message: 'Database error' });
                    }
                    return res.status(200).json({ message: 'User successfully registered. Now you can login' });
                });
            });
        
        }
        return res.status(404).json({message: "Unable to register user."});
});

app.post("/login", (req,res) => {
    const username = req.body.username;
    const password = req.body.password
    if (!username || !password) {
        return res.status(404).json({message: "Body Empty"});
    }

    if(authenticatedUser(username,password)) {
        let accessToken = jwt.sign({data: user}, 'access');
    
        req.session.authorization = {accessToken,username}

        const query = 'SELECT password FROM Users WHERE username = ?';
        connection.query(query, [username], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (results.length === 0) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        const hashedPassword = results[0].password;
        if (bcrypt.compareSync(password, hashedPassword)) {
            res.status(200).json({ message: 'Login successful' });
        } else {
            res.status(400).json({ error: 'Invalid username or password' });
        }
        });
    }
    return requestAnimationFrame.status(208).json({message : "Invalid Login,Check Username and password"});

});

// Integration test for the /register route
describe('POST /register', () => {
    before(done => {
        // Clean up the database before each test
        connection.query('DELETE FROM Users', done);
    });

    it('should register a new user', done => {
        request(app)
            .post('/register')
            .send({ username: 'testuser', password: 'testpassword', email: 'test@example.com' })
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body.message).to.equal('User successfully registered. Now you can login');
                done();
            });
    });

    it('should not register a user with an existing username', done => {
        // First register the user
        request(app)
            .post('/register')
            .send({ username: 'testuser', password: 'testpassword', email: 'test@example.com' })
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                // Try to register the same user again
                request(app)
                    .post('/register')
                    .send({ username: 'testuser', password: 'testpassword', email: 'test2@example.com' })
                    .expect(404)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body.message).to.equal('User already exists!');
                        done();
                    });
            });
    });
});

// Integration test for the /login route
describe('POST /login', () => {
    before(done => {
        // Clean up the database and register a user before tests
        connection.query('DELETE FROM Users', () => {
            const hashedPassword = bcrypt.hashSync('testpassword', 10);
            connection.query('INSERT INTO Users (username, email, password) VALUES (?, ?, ?)', 
                ['testuser', 'test@example.com', hashedPassword], done);
        });
    });

    it('should login a user with correct credentials', done => {
        request(app)
            .post('/login')
            .send({ username: 'testuser', password: 'testpassword' })
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body.message).to.equal('Login successful');
                done();
            });
    });

    it('should not login a user with incorrect credentials', done => {
        request(app)
            .post('/login')
            .send({ username: 'testuser', password: 'wrongpassword' })
            .expect(400)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body.error).to.equal('Invalid username or password');
                done();
            });
    });
});




  
app.listen(PORT,()=>console.log("Server is running at port "+PORT));