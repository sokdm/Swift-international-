const mongoose = require("mongoose")

const transferSchema = new mongoose.Schema({

  fromUser:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  },

  toUser:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  },

  amount:{
    type:Number,
    required:true
  },

  status:{
    type:String,
    default:"completed"
  }

},{
  timestamps:true
})

module.exports = mongoose.model("Transfer", transferSchema)
