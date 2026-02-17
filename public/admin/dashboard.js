const usersTable = document.getElementById("usersTable")

async function loadUsers() {
  try {
    const res = await fetch("/api/admin/users")
    const users = await res.json()

    usersTable.innerHTML = ""

    users.forEach(user => {
      const tr = document.createElement("tr")

      tr.innerHTML = `
        <td>${user.name || ""}</td>
        <td>${user.email}</td>
        <td>$${user.balance || 0}</td>
        <td>${user.locked ? "🔒 Locked" : "✅ Active"}</td>
        <td>
          ${
            user.locked
              ? `<button onclick="unlockUser('${user._id}')">Unlock</button>`
              : `<button onclick="lockUser('${user._id}')">Lock</button>`
          }
          <button onclick="sendMoney('${user._id}')">Send Money</button>
        </td>
      `

      usersTable.appendChild(tr)
    })

  } catch (err) {
    console.log(err)
  }
}

async function lockUser(id) {
  await fetch("/api/admin/lock/" + id, { method: "PUT" })
  loadUsers()
}

async function unlockUser(id) {
  await fetch("/api/admin/unlock/" + id, { method: "PUT" })
  loadUsers()
}

async function sendMoney(id) {
  const amount = prompt("Enter amount")

  if (!amount) return

  await fetch("/api/admin/send-money", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: id,
      amount
    })
  })

  loadUsers()
}

loadUsers()
