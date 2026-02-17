const router = require("express").Router()

const User = require("../models/User")
const Transaction = require("../models/Transaction")
const SupportChat = require("../models/SupportChat")

/* ================= GET ALL USERS ================= */
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password")
    res.json(users)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Server error" })
  }
})

/* ================= LOCK USER ================= */
router.put("/lock/:id", async (req, res) => {
  try {

    await User.findByIdAndUpdate(req.params.id, {
      isLocked: true,
      isLockedForTransfer: true
    })

    res.json({ message: "User locked successfully" })

  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Error locking user" })
  }
})

/* ================= UNLOCK USER ================= */
router.put("/unlock/:id", async (req, res) => {
  try {

    await User.findByIdAndUpdate(req.params.id, {
      isLocked: false,
      isLockedForTransfer: false
    })

    res.json({ message: "User unlocked successfully" })

  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Error unlocking user" })
  }
})

/* ================= ADMIN SEND MONEY ================= */
router.post("/send-money", async (req, res) => {
  try {

    const { userId, amount } = req.body

    if (!userId || !amount) {
      return res.status(400).json({ message: "Missing fields" })
    }

    const numericAmount = Number(amount)

    if (numericAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount" })
    }

    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.isLocked) {
      return res.status(403).json({
        message: "User account is locked"
      })
    }

    user.balance += numericAmount
    user.totalReceived += numericAmount
    await user.save()

    const tx = await Transaction.create({
      userId: user._id,
      amount: numericAmount,
      type: "admin_credit",
      status: "completed",
      description: "Admin credit"
    })

    const io = req.app.get("io")

    if (io) {
      io.to(user._id.toString()).emit("notification", {
        message: `You received $${numericAmount} from Admin`,
        amount: numericAmount,
        type: "admin_credit"
      })
    }

    res.json({
      message: "Money sent successfully",
      receipt: {
        id: tx._id,
        amount: numericAmount,
        type: "admin_credit",
        date: tx.createdAt
      }
    })

  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Transfer error" })
  }
})

/* ================= GET ALL TRANSACTIONS ================= */
router.get("/transactions", async (req, res) => {
  try {

    const tx = await Transaction.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })

    res.json(tx)

  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Error loading transactions" })
  }
})

/* ================= SUPPORT - GET USERS WHO MESSAGED ================= */
router.get("/support/users", async (req, res) => {
  try {

    const userIds = await SupportChat.distinct("userId")

    const users = await User.find({
      _id: { $in: userIds }
    }).select("name email")

    res.json(users)

  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Error loading support users" })
  }
})

/* ================= SUPPORT - GET CHAT BY USER ================= */
router.get("/support/chat/:userId", async (req, res) => {
  try {

    const messages = await SupportChat.find({
      userId: req.params.userId
    }).sort({ createdAt: 1 })

    res.json(messages)

  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Error loading chat" })
  }
})

/* ================= SUPPORT - ADMIN SEND MESSAGE ================= */
router.post("/support/send", async (req, res) => {
  try {

    const { userId, message } = req.body

    if (!userId || !message) {
      return res.status(400).json({
        message: "Missing fields"
      })
    }

    const msg = await SupportChat.create({
      userId,
      message,
      sender: "admin"
    })

    const io = req.app.get("io")

    if (io) {
      io.to("support_" + userId).emit("newSupportMessage", msg)
      io.to("admin_support_room").emit("newSupportMessage", msg)
    }

    res.json({
      message: "Reply sent",
      data: msg
    })

  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Send error" })
  }
})

module.exports = router
