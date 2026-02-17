<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin Dashboard</title>

<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>

<style>
body{margin:0;font-family:Arial;background:#f4f6fb;}
.sidebar{width:240px;height:100vh;background:#1f2a44;color:white;position:fixed;padding:20px;}
.sidebar a{display:block;color:white;margin:15px 0;cursor:pointer;}
.main{margin-left:240px;padding:30px;}
.card{background:white;padding:20px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.08);margin-bottom:20px;}
table{width:100%;border-collapse:collapse;}
table th,table td{padding:12px;border-bottom:1px solid #eee;}
button{padding:8px 14px;border:none;border-radius:6px;cursor:pointer;}
.lock{background:red;color:white}
.unlock{background:green;color:white}
.send{background:#2b4eff;color:white}
.topbar{background:white;padding:15px;border-radius:12px;margin-bottom:20px;}
.supportContainer{display:flex;height:500px;}
.usersList{width:250px;border-right:1px solid #eee;overflow-y:auto;}
.usersList div{padding:12px;border-bottom:1px solid #eee;cursor:pointer;}
.usersList div:hover{background:#f2f4ff;}
.chatArea{flex:1;display:flex;flex-direction:column;}
.chatMessages{flex:1;padding:15px;overflow-y:auto;background:#fafafa;}
.chatInput{display:flex;border-top:1px solid #eee;}
.chatInput input{flex:1;padding:12px;border:none;}
.chatInput button{background:#2b4eff;color:white;padding:12px 20px;}
.msgUser{text-align:right;color:#2b4eff;margin:6px 0;}
.msgAdmin{text-align:left;color:#333;margin:6px 0;}
</style>
</head>

<body>

<div class="sidebar">
<h2>Swift Admin</h2>
<a onclick="showUsers()">Users</a>
<a onclick="showSupport()">Support Chat</a>
<a onclick="logout()">Logout</a>
</div>

<div class="main">

<div class="topbar">Welcome Admin 👑</div>

<div class="card" id="usersCard">
<h3>Users</h3>
<table id="usersTable">
<thead>
<tr>
<th>Name</th>
<th>Email</th>
<th>Balance</th>
<th>Status</th>
<th>Actions</th>
</tr>
</thead>
<tbody></tbody>
</table>
</div>

<div class="card" id="supportCard" style="display:none">
<h3>Support Chat</h3>
<div class="supportContainer">
<div class="usersList" id="supportUsers"></div>

<div class="chatArea">
<div class="chatMessages" id="chatMessages"></div>
<div class="chatInput">
<input id="adminMsgInput" placeholder="Type reply...">
<button onclick="sendAdminMsg()">Send</button>
</div>
</div>

</div>
</div>

</div>

<script>
const token = localStorage.getItem("adminToken")
if(!token) window.location.href="/admin/login.html"

const usersCard = document.getElementById("usersCard")
const supportCard = document.getElementById("supportCard")

/* ================= USERS ================= */

async function loadUsers(){
try{
const res = await fetch("/api/admin/users",{headers:{Authorization:token}})
const users = await res.json()

const tbody = document.querySelector("#usersTable tbody")
tbody.innerHTML=""

users.forEach(u=>{
tbody.innerHTML += `
<tr>
<td>${u.name}</td>
<td>${u.email}</td>
<td>$${u.balance}</td>
<td>${u.isLocked ? "Locked" : "Active"}</td>
<td>
<button class="send" onclick="sendMoney('${u._id}')">Send</button>
${u.isLocked
? `<button class="unlock" onclick="unlockUser('${u._id}')">Unlock</button>`
: `<button class="lock" onclick="lockUser('${u._id}')">Lock</button>`
}
</td>
</tr>`
})
}catch(err){
console.log(err)
}
}

async function lockUser(id){
await fetch("/api/admin/lock/"+id,{method:"PUT",headers:{Authorization:token}})
loadUsers()
}

async function unlockUser(id){
await fetch("/api/admin/unlock/"+id,{method:"PUT",headers:{Authorization:token}})
loadUsers()
}

async function sendMoney(id){
const amount = prompt("Enter amount")
if(!amount) return

await fetch("/api/admin/send-money",{
method:"POST",
headers:{
"Content-Type":"application/json",
Authorization:token
},
body:JSON.stringify({userId:id,amount})
})

loadUsers()
}

/* ================= SUPPORT ================= */

let socket=null
let currentUserId=null
let supportUsersMap={}

function initSupport(){

document.getElementById("supportUsers").innerHTML=""
document.getElementById("chatMessages").innerHTML=""
supportUsersMap={}
currentUserId=null

if(!socket){
socket=io()

socket.emit("joinAdminSupport")

socket.on("newSupportMessage",(msg)=>{
addSupportUser(msg.userId)

if(msg.userId===currentUserId){
addMessage(msg.sender,msg.message)
}
})
}

loadSupportUsers()
}

async function loadSupportUsers(){
try{

// ✅ FIXED ROUTE
const res=await fetch("/api/admin/support/users",{
headers:{Authorization:token}
})

const users=await res.json()

users.forEach(u=>{
addSupportUser(u.userId || u._id)
})

}catch(err){
console.log(err)
}
}

function addSupportUser(userId){
if(!userId) return
if(supportUsersMap[userId]) return

supportUsersMap[userId]=true

const div=document.createElement("div")
div.innerText="User "+userId.slice(-6)
div.onclick=()=>openChat(userId)

document.getElementById("supportUsers").appendChild(div)
}

async function openChat(userId){
currentUserId=userId

// ✅ FIXED ROUTE
const res=await fetch("/api/admin/support/chat/"+userId,{
headers:{Authorization:token}
})

const msgs=await res.json()

const box=document.getElementById("chatMessages")
box.innerHTML=""

msgs.forEach(m=>addMessage(m.sender,m.message))
}

function sendAdminMsg(){
const input=document.getElementById("adminMsgInput")

if(!input.value || !currentUserId) return

socket.emit("supportAdminMessage",{
userId:currentUserId,
message:input.value
})

addMessage("admin",input.value)
input.value=""
}

function addMessage(sender,text){
const box=document.getElementById("chatMessages")

const div=document.createElement("div")
div.className=sender==="admin"?"msgAdmin":"msgUser"
div.innerText=text

box.appendChild(div)
box.scrollTop=box.scrollHeight
}

/* ================= UI ================= */

function showUsers(){
usersCard.style.display="block"
supportCard.style.display="none"
}

function showSupport(){
usersCard.style.display="none"
supportCard.style.display="block"
initSupport()
}

function logout(){
localStorage.removeItem("adminToken")
window.location.href="/admin/login.html"
}

loadUsers()
</script>

</body>
</html>
