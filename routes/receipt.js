const router = require("express").Router()
const Transaction = require("../models/Transaction")

router.get("/:receiptId", async (req,res)=>{
  try{

    const tx = await Transaction.findOne({
      receiptId: req.params.receiptId
    })

    if(!tx) return res.json({msg:"Receipt not found"})

    res.json(tx)

  }catch{
    res.json({msg:"Server error"})
  }
})

module.exports = router
