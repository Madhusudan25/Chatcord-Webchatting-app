const socket=io()

const btn=document.getElementById("submitBTN");

btn.addEventListener("click",function(e){
    e.preventDefault();
    const username=document.getElementById("username").value;
    const roomname=document.getElementById("room").value;
    if(username.trim()==""){
        document.getElementById("username").style.border="1px solid red";
        setTimeout(function(){
            document.getElementById("username").style.border="1px solid black";
        },3000);
        document.getElementById("username").value="";
    }else{
        socket.emit("requestToJoin",{username,roomname})
    }
    
})

socket.on("UserDoesnotExist",function(url){
    console.log(url);
    window.location.href=url;
})

socket.on("UserExists",function(url){
    alert("User with this name already exists in this room!");
    document.getElementById("myForm").reset();
})