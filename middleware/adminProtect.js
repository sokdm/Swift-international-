const jwt = require("jsonwebtoken")
const Admin = require("../models/Admin")

module.exports = async (req,res,next)=>{

 try{

   const token = req.headers.authorization?.split(" ")[1]

   if(!token){
     return res.status(401).json({msg:"No token"})
   }

   const decoded = jwt.verify(token,process.env.JWT_SECRET)

   if(decoded.type !== "admin"){
     return res.status(403).json({msg:"Admin only"})
   }

   const admin = await Admin.findById(decoded.id)

   if(!admin){
     return res.status(403).json({msg:"Admin not found"})
   }

   req.admin = admin
   next()

 }catch{
   res.status(401).json({msg:"Invalid token"})
 }

}
