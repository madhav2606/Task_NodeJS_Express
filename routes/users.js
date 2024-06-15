const express = require('express');
const router = express.Router();


let users = []

router.get("/",(req,res)=>{
  res.send(users);
});

router.post("/",(req,res)=>{
  users.push({"firstName":req.query.firstName});
  res.send("The user" + (' ')+ (req.query.firstName) + " Has been added!")
});

router.get('/profile', (req, res) => {
  res.json({
    message: 'Profile information retrieved successfully',
    user: req.user
  });
});

module.exports=router;
