const socket=io();
const chatMessages=document.querySelector(".chat-messages");
const chatForm=document.getElementById("chat-form");
// const msg=document.getElementById("msg");
const userList=document.getElementById("users");
const roomname=document.getElementById("room-name");
const mute=document.getElementById("mute");
const unmute=document.getElementById("unmute");
const sidebar=document.getElementById("sidebar");
const chatSidebar=document.getElementById("chat-sidebar");

const audio=new Audio("/audio/ting.mp3");

mute.addEventListener("click",function(e){
    mute.classList.add("hidden");
    unmute.classList.remove("hidden");
})

unmute.addEventListener("click",function(e){
    mute.classList.remove("hidden");
    unmute.classList.add("hidden");
})

// sidebar.addEventListener("click",function(e){
//     if(chatSidebar.style.display == "block"){
//         chatSidebar.style.display = "none";
//     }else{
//         chatSidebar.style.display = "inline";
//         chatSidebar.style.width = "50%";
//         chatSidebar.style.position = "absolute";
//         chatSidebar.style.borderRadius = "10px";
//     }
// })

function userDetails(){
    var pathArray=window.location.pathname.split("/");
    var username=decodeURI(pathArray[2]);
    var roomname=decodeURI(pathArray[3]);
    
    return {
        username,roomname
    }
}

function myfunction(){
    socket.emit("JoinRoom",userDetails());
}

socket.on("UserExists",function(url){
    window.location.href=url;
})

socket.on("broadcast",function(username){
    outputBroadcastMessage(username);
    chatMessages.scrollTop=chatMessages.scrollHeight;
})

chatForm.addEventListener("submit",function(e){
    e.preventDefault();
    const msg=e.target.elements.msg.value;
    if(msg.trim()==""){
        document.getElementById("msg").style.borderBottom="1px solid red";
        setTimeout(function(){
            document.getElementById("msg").style.borderBottom="0px";
        },2000)
    }else{
        // Emitting message to server
        socket.emit("chatMessage",msg);
        e.target.elements.msg.value="";
        e.target.elements.msg.focus();
    }
    
})

socket.on("selfMessage",function(message){
        outputMessage(message,"right");
        // Auto Scroll Down
        chatMessages.scrollTop=chatMessages.scrollHeight;
    
})


socket.on("message",function(message){
    outputMessage(message,"left");
    if(unmute.classList.contains("hidden")){
        audio.play();
    }
    // Auto Scroll Down
    chatMessages.scrollTop=chatMessages.scrollHeight;
})

socket.on("users",function(userArray){
    userList.innerHTML="";
    userArray.forEach(user => {
        userList.innerHTML=userList.innerHTML + `<li>${user.userName}</li>\n`;
    });
})

socket.on("room",function(room){
    roomname.innerHTML=room;
})


// Functions
function outputBroadcastMessage(username){
    const div=document.createElement("div");
    div.classList.add("message");
    div.classList.add("message-center");
    div.innerHTML=`<p>${username}</p>`
    document.querySelector(".chat-messages").append(div);
}


function outputMessage(message,position){
    const div=document.createElement("div");
    div.classList.add("message");
    div.classList.add("message-"+position);
    div.innerHTML=`<p class="meta">${message.username} <span>${message.time}</span></p>
    <p class="text">
        ${message.text}
    </p>`;
    document.querySelector(".chat-messages").append(div);
    
}