const ICE_SERVERS = [
    { urls: "stun:192.168.1.47:3478" },
    { urls: "turn:192.168.1.47:3478?transport=udp", username: "test", credential: "testpass" },
    { urls: "turn:192.168.1.47:3478?transport=tcp", username: "test", credential: "testpass" },
];

const socket = io("http://localhost:3000", {
    auth: {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiIwODY0YjE0NC02MmZmLTRiMDItOThkMy1mNTQ0NjdkOWZlNDkiLCJyb2xlIjoiYWRtaW4iLCJzZXNzaW9uSWQiOiI5NWZiODExNi1hMjNiLTQ1MGMtOWZmMy00MGVjM2RlODRjNjIiLCJpYXQiOjE3NjEzMTQ3NzQsImV4cCI6MTc2MTM2ODc3NH0.KbzC_u2vwv-mc2jH2-lhSkuAbW4NIuXZ7ZvgZY-diEw"
    }
}); // adjust backend URL if needed
let pc, localStream;
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

socket.on("connect", () => {
    console.log("Callee connected:", socket.id);
});

socket.on("call:offer", async data => {
    console.log("Received offer");
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

    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("call:answer", { answer });
});

document.getElementById("endCall").onclick = () => {
    socket.emit("call:end");
    if (pc) pc.close();
    console.log("Call ended");
};

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
