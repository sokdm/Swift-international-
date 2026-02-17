const router = require("express").Router()
const SupportChat = require("../models/SupportChat")


// ================= ADMIN — GET USERS WHO MESSAGED =================
router.get("/admin/users", async (req, res) => {
  try {

    const users = await SupportChat.aggregate([
      {
        $sort: { createdAt: 1 }
      },
      {
        $group: {
          _id: "$userId",
          lastMessage: { $last: "$message" },
          lastDate: { $last: "$createdAt" }
        }
      },
      {
        $sort: { lastDate: -1 }
      }
    ])

    res.json(
      users.map(u => ({
        userId: u._id,
        lastMessage: u.lastMessage,
        lastDate: u.lastDate
      }))
    )

  } catch (err) {
    console.log(err)
    res.status(500).json({ message: err.message })
  }
})


// ================= GET CHAT HISTORY (USER + ADMIN USE) =================
router.get("/:userId", async (req, res) => {
  try {

    const chats = await SupportChat.find({
      userId: req.params.userId
    })
    .sort({ createdAt: 1 })
    .lean()

    res.json(chats)

  } catch (err) {
    console.log(err)
    res.status(500).json({ message: err.message })
  }
})


module.exports = router
