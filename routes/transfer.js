const express = require("express")
const router = express.Router()
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const Transaction = require("../models/Transaction")

// ================= AUTH =================
function auth(req, res, next) {
  try {

    const token = req.headers.authorization?.split(" ")[1]

    if (!token) {
      return res.status(401).json({
        success:false,
        msg: "No token provided"
      })
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret123"
    )

    req.userId = decoded.id
    next()

  } catch (err) {
    return res.status(401).json({
      success:false,
      msg: "Invalid token"
    })
  }
}

// ================= TRANSFER =================
router.post("/", auth, async (req, res) => {
  try {

    const { accountNumber, receiverName, bankName, amount } = req.body

    // ===== VALIDATION =====
    if (!accountNumber || !receiverName || !bankName || !amount) {
      return res.status(400).json({
        success:false,
        msg: "All fields required"
      })
    }

    const transferAmount = Number(amount)

    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({
        success:false,
        msg: "Invalid amount"
      })
    }

    // ===== FIND SENDER =====
    const sender = await User.findById(req.userId)

    if (!sender) {
      return res.status(404).json({
        success:false,
        msg: "Sender not found"
      })
    }

    // 🚨 FULL ACCOUNT LOCK CHECK
    if (sender.isLocked === true) {
      return res.status(403).json({
        success:false,
        msg: "Account locked. Contact support."
      })
    }

    // 🚨 TRANSFER LOCK CHECK
    if (sender.isLockedForTransfer === true) {
      return res.status(403).json({
        success:false,
        msg: "Transfers disabled by admin. Contact support."
      })
    }

    // ===== BALANCE CHECK =====
    if (sender.balance < transferAmount) {
      return res.status(400).json({
        success:false,
        msg: "Insufficient balance"
      })
    }

    // ===== DEBIT USER =====
    sender.balance -= transferAmount
    sender.totalSent += transferAmount

    await sender.save()

    // ===== RECEIPT ID =====
    const receiptId =
      "RCPT-" +
      Date.now() +
      "-" +
      Math.random().toString(36).substring(2, 8).toUpperCase()

    // ===== SAVE TRANSACTION =====
    const tx = await Transaction.create({
      userId: sender._id,
      direction: "sent",
      type: "transfer",
      amount: transferAmount,
      receiverName,
      bankName,
      accountNumber,
      receiptId,
      status: "completed"
    })

    return res.json({
      success: true,
      msg: "Transfer successful",
      openReceipt: true,
      receipt: {
        receiptId: tx.receiptId,
        senderName: sender.name,
        receiverName: tx.receiverName,
        bankName: tx.bankName,
        accountNumber: tx.accountNumber,
        amount: tx.amount,
        status: tx.status,
        date: tx.createdAt
      }
    })

  } catch (err) {
    console.log("Transfer Error:", err)
    return res.status(500).json({
      success:false,
      msg: "Server error"
    })
  }
})

module.exports = router
