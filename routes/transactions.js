const router = require("express").Router()
const jwt = require("jsonwebtoken")
const Transaction = require("../models/Transaction")

// AUTH MIDDLEWARE
function auth(req,res,next){
  const token = req.headers.authorization?.split(" ")[1]
  if(!token) return res.status(401).json({msg:"No token"})

  try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123")
    req.userId = decoded.id
    next()
  }catch{
    res.status(401).json({msg:"Invalid token"})
  }
}

// GET USER TRANSACTIONS
router.get("/", auth, async (req,res)=>{
  try{

    const tx = await Transaction.find({
      userId: req.userId
    }).sort({ createdAt:-1 })

    res.json(tx)

  }catch(err){
    console.log(err)
    res.status(500).json({msg:"Server error"})
  }
})

module.exports = router
