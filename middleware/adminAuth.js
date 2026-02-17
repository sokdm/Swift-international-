const jwt = require("jsonwebtoken")

module.exports = function(req,res,next){

const token = req.headers.authorization

if(!token) return res.status(401).json({msg:"No token"})

try{
const decoded = jwt.verify(token, process.env.ADMIN_SECRET)

if(!decoded.admin) return res.status(403).json({msg:"Not admin"})

req.admin = decoded
next()

}catch(err){
res.status(401).json({msg:"Invalid token"})
}

}
