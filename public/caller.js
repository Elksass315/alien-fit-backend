const ICE_SERVERS = [
    { urls: "stun:192.168.1.47:3478" },
    { urls: "turn:192.168.1.47:3478?transport=udp", username: "test", credential: "testpass" },
    { urls: "turn:192.168.1.47:3478?transport=tcp", username: "test", credential: "testpass" },
];

const socket = io("http://localhost:3000",
    { auth: { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI0YzI1ZTMxMy03ZGFmLTQxODctOTU2Yi1iMjVmZTQ1ODYwMTEiLCJyb2xlIjoidXNlciIsInNlc3Npb25JZCI6ImQ2NTVlZjk5LTI0M2QtNGUyYS1iYTE4LTYxZWJjZDhiZjJhYiIsImlhdCI6MTc2MTMxNDczMCwiZXhwIjoxNzYxMzY4NzMwfQ.dmI3MIYeMHEEmTI1W-rHAQyrzeRM1ZoKwPf5bPbZXAY" } }
); // adjust backend URL if needed
let pc, localStream;
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

socket.on("connect", () => {
    console.log("Caller connected:", socket.id);
});

document.getElementById("startCall").onclick = async () => {
    pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    localVideo.srcObject = localStream;
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    pc.ontrack = e => (remoteVideo.srcObject = e.streams[0]);

    pc.onicecandidate = e => {
        if (e.candidate) {
            socket.emit("call:ice-candidate", { candidate: e.candidate });
        }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("call:offer", { offer });
};

document.getElementById("endCall").onclick = () => {
    socket.emit("call:end");
    if (pc) pc.close();
    console.log("Call ended");
};

socket.on("call:answer", async data => {
    console.log("Received answer");
    await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
});

socket.on("call:ice-candidate", async data => {
    try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (err) {
        console.error("Error adding candidate:", err);
    }
});

socket.on("call:end", () => {
    console.log("Call ended by peer");
    if (pc) pc.close();
});
