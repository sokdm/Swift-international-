const router = require("express").Router()
const jwt = require("jsonwebtoken")

// ADMIN LOGIN
router.post("/login", async (req,res)=>{

  try{

    const { email,password } = req.body

    // CHECK ENV ADMIN
    if(
      email !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ){
      return res.status(401).json({ message:"Invalid admin credentials" })
    }

    // CREATE TOKEN
    const token = jwt.sign(
      { role:"admin" },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn:"7d" }
    )

    res.json({ token })

  }catch(err){
    res.status(500).json({ message:"Server error" })
  }

})

module.exports = router
