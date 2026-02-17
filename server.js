require("dotenv").config()

const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const path = require("path")
const http = require("http")
const { Server } = require("socket.io")

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000
})

app.set("io", io)

// ================= MODELS =================
const SupportChat = require("./models/SupportChat")
const User = require("./models/User")

// ================= MIDDLEWARE =================
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, "public")))

// ================= ROUTES =================
app.use("/api/auth", require("./routes/auth"))
app.use("/api/transfer", require("./routes/transfer"))
app.use("/api/support", require("./routes/support"))
app.use("/api/transactions", require("./routes/transactions"))
app.use("/api/admin-auth", require("./routes/adminAuth"))
app.use("/api/admin", require("./routes/admin"))

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "auth.html"))
})

// ================= DATABASE =================
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => {
  console.log("❌ MongoDB Error:", err.message)
  process.exit(1)
})

// ================= SOCKET =================
io.on("connection", (socket) => {

  console.log("🔌 Socket Connected:", socket.id)

  // ===== USER REGISTER (Notifications + Support) =====
  socket.on("register", (userId) => {
    if (!userId) return

    socket.join(userId.toString())
    socket.join("support_" + userId)

    console.log("👤 User registered + joined support:", userId)
  })

  // ===== USER JOIN SUPPORT (SAFE DOUBLE JOIN) =====
  socket.on("joinSupport", (data) => {
    if (!data || !data.userId) return

    socket.join("support_" + data.userId)
    console.log("👤 User joined support:", data.userId)
  })

  // ===== ADMIN JOIN SUPPORT =====
  socket.on("joinAdminSupport", () => {
    socket.join("admin_support_room")
    console.log("🛠 Admin joined support")
  })

  // ===== USER SEND SUPPORT MESSAGE =====
  socket.on("supportUserMessage", async (data) => {
    try {

      if (!data?.userId || !data?.message) return

      const msg = await SupportChat.create({
        userId: data.userId,
        sender: "user",
        message: data.message
      })

      io.to("admin_support_room").emit("newSupportMessage", msg)
      io.to("support_" + data.userId).emit("newSupportMessage", msg)

    } catch (err) {
      console.log("Support User Msg Error:", err.message)
    }
  })

  // ===== ADMIN SEND SUPPORT MESSAGE =====
  socket.on("supportAdminMessage", async (data) => {
    try {

      if (!data?.userId || !data?.message) return

      const msg = await SupportChat.create({
        userId: data.userId,
        sender: "admin",
        message: data.message
      })

      io.to("support_" + data.userId).emit("newSupportMessage", msg)
      io.to("admin_support_room").emit("newSupportMessage", msg)

    } catch (err) {
      console.log("Support Admin Msg Error:", err.message)
    }
  })

  socket.on("disconnect", () => {
    console.log("❌ Socket Disconnected:", socket.id)
  })

})

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack)
  res.status(500).json({ msg: "Internal Server Error" })
})

// ================= SERVER =================
const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
