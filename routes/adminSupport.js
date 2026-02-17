/* ================= ADMIN SUPPORT USERS LIST ================= */
router.get("/support/users", async (req, res) => {
  try {

    // Find unique users who have sent support messages
    const users = await Transaction.aggregate([
      {
        $match: { type: "support" }
      },
      {
        $group: {
          _id: "$userId",
          lastMessage: { $last: "$message" },
          lastDate: { $last: "$createdAt" }
        }
      }
    ])

    // Populate user info
    const populated = await User.populate(users, {
      path: "_id",
      select: "name email"
    })

    res.json(populated)

  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Error loading support users" })
  }
})

/* ================= ADMIN GET USER CHAT ================= */
router.get("/support/chat/:userId", async (req, res) => {
  try {

    const messages = await Transaction.find({
      userId: req.params.userId,
      type: "support"
    }).sort({ createdAt: 1 })

    res.json(messages)

  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Error loading chat" })
  }
})

/* ================= ADMIN SEND MESSAGE TO USER ================= */
router.post("/support/send", async (req, res) => {
  try {

    const { userId, message } = req.body

    if (!userId || !message) {
      return res.status(400).json({
        message: "Missing fields"
      })
    }

    const msg = await Transaction.create({
      userId,
      type: "support",
      direction: "admin",
      message,
      status: "sent"
    })

    // ===== REALTIME SOCKET =====
    const io = req.app.get("io")

    if (io) {
      io.to(userId.toString()).emit("supportMessage", msg)
    }

    res.json({
      success: true,
      message: "Message sent",
      data: msg
    })

  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Error sending message" })
  }
})
