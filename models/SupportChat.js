const mongoose = require("mongoose")

const supportChatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  sender: String, // user or admin
  message: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model("SupportChat", supportChatSchema)
