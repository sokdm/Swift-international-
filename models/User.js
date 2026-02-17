const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({

name: {
  type: String,
  required: true
},

email: {
  type: String,
  unique: true,
  required: true
},

password: {
  type: String,
  required: true
},

/* ===== BANK INFO ===== */
accountNumber: {
  type: String,
  unique: true,
  default: () =>
    Math.floor(1000000000 + Math.random() * 9000000000).toString()
},

bankName: {
  type: String,
  default: "Swift Bank"
},

balance: {
  type: Number,
  default: 0
},

totalSent: {
  type: Number,
  default: 0
},

totalReceived: {
  type: Number,
  default: 0
},

/* ===== SECURITY ===== */

// LOGIN LOCK
isLocked: {
  type: Boolean,
  default: false
},

// TRANSFER LOCK (ADMIN CONTROL)
isLockedForTransfer: {
  type: Boolean,
  default: false
},

// 🔒 TRANSACTION PIN (NEW — SAFE ADD)
transactionPin: {
  type: String,
  default: null
},

/* ===== META ===== */
createdAt: {
  type: Date,
  default: Date.now
}

})

module.exports = mongoose.model("User", userSchema)
