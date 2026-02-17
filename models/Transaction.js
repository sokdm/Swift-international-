const mongoose = require("mongoose")

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  direction: {
    type: String,
    enum: ["sent", "received", "system"],
    default: "sent"
  },

  amount: {
    type: Number,
    required: true
  },

  type: {
    type: String,
    enum: ["transfer","deposit","withdraw","admin_credit"],
    default: "transfer"
  },

  receiverName: String,
  bankName: String,
  accountNumber: String,

  receiptId: {
    type: String,
    unique: true
  },

  status: {
    type: String,
    enum: ["pending","completed","failed"],
    default: "completed"
  }

},{ timestamps:true })

module.exports = mongoose.model("Transaction", TransactionSchema)
