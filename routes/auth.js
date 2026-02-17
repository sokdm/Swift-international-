const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const User = require("../models/User")

/* ================= HELPERS ================= */

// Generate 10 digit account number
function generateAccountNumber(){
  return Math.floor(1000000000 + Math.random() * 9000000000).toString()
}

// JWT Middleware
function auth(req,res,next){
  try{

    const header = req.headers.authorization
    if(!header) return res.status(401).json({ msg:"No token" })

    const token = header.split(" ")[1]

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret123"
    )

    req.userId = decoded.id
    next()

  }catch(err){
    res.status(401).json({ msg:"Invalid token" })
  }
}

/* ================= REGISTER ================= */
router.post("/register", async (req,res)=>{
try{

const { name,email,password } = req.body

if(!name || !email || !password){
return res.json({ msg:"All fields required" })
}

const exist = await User.findOne({ email })
if(exist) return res.json({ msg:"Email already exists" })

const hash = await bcrypt.hash(password,10)

await User.create({
name,
email,
password:hash,

/* Auto Finance Fields */
accountNumber: generateAccountNumber(),
balance: 0,
totalSent: 0,
totalReceived: 0
})

res.json({ msg:"Registered successfully" })

}catch(err){
console.log(err)
res.json({ msg:"Server error" })
}
})

/* ================= LOGIN ================= */
router.post("/login", async (req,res)=>{
try{

const { email,password } = req.body

const user = await User.findOne({ email })
if(!user) return res.json({ msg:"User not found" })

const match = await bcrypt.compare(password,user.password)
if(!match) return res.json({ msg:"Wrong password" })

const token = jwt.sign(
{ id:user._id },
process.env.JWT_SECRET || "secret123",
{ expiresIn:"7d" }
)

res.json({ token })

}catch(err){
res.json({ msg:"Server error" })
}
})

/* ================= GET CURRENT USER ================= */
router.get("/me", auth, async (req,res)=>{
try{

const user = await User.findById(req.userId).select("-password")

if(!user) return res.json({ msg:"User not found" })

res.json(user)

}catch(err){
res.json({ msg:"Server error" })
}
})

module.exports = router
