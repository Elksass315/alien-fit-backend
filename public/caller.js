const ICE_SERVERS = [
    { urls: "stun:192.168.1.47:3478" },
    { urls: "turn:192.168.1.47:3478?transport=udp", username: "test", credential: "testpass" },
    { urls: "turn:192.168.1.47:3478?transport=tcp", username: "test", credential: "testpass" },
];

const socket = io({
    auth: { token: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI0YzI1ZTMxMy03ZGFmLTQxODctOTU2Yi1iMjVmZTQ1ODYwMTEiLCJyb2xlIjoidXNlciIsInNlc3Npb25JZCI6IjcxNzU0YWQ3LTNiNTgtNDBmZS04Y2IyLWExMzljNWI0NzQ4MyIsImlhdCI6MTc2MTQxMjkyNiwiZXhwIjoxNzYxNDY2OTI2fQ.mu0HmIAj-n0zFYZjbcZSGkdj6cRvHzYm38CXAZUZixg" }
}); // adjust backend URL if needed

let pc;
let localStream;
let pendingRemoteCandidates = [];

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const startBtn = document.getElementById("startCall");
const endBtn = document.getElementById("endCall");

socket.on("connect", () => {
    console.log("Caller connected:", socket.id);
});

function cleanupCall() {
    if (pc) {
        pc.close();
        pc = null;
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
    pendingRemoteCandidates = [];
}

async function addOrQueueCandidate(candidate) {
    if (!pc || !candidate) return;
    if (!pc.remoteDescription) {
        pendingRemoteCandidates.push(candidate);
        return;
    }
    try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
        console.error("Error adding remote candidate", error);
    }
}

async function drainPendingCandidates() {
    if (!pc) return;
    for (const c of pendingRemoteCandidates) {
        try {
            await pc.addIceCandidate(new RTCIceCandidate(c));
        } catch (error) {
            console.error("Error adding queued candidate", error);
        }
    }
    pendingRemoteCandidates = [];
}

startBtn.onclick = async () => {
    if (pc) {
        console.warn("Call already active");
        return;
    }

    try {
        pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

        pc.ontrack = event => {
            if (event.streams && event.streams[0]) {
                remoteVideo.srcObject = event.streams[0];
            }
        };

        pc.onicecandidate = event => {
            if (event.candidate) {
                socket.emit("call:ice-candidate", { candidate: event.candidate, target: "trainers" });
            }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("call:offer", { offer, target: "trainers" });
    } catch (error) {
        console.error("Failed to start call", error);
        cleanupCall();
    }
};

endBtn.onclick = () => {
    socket.emit("call:end", { status: "ended" });
    cleanupCall();
};

socket.on("call:answer", async ({ answer }) => {
    if (!pc) {
        console.warn("No active peer connection to apply answer");
        return;
    }

    try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await drainPendingCandidates();
        console.log("Received answer from trainer");
    } catch (error) {
        console.error("Failed to apply remote answer", error);
    }
});

socket.on("call:ice-candidate", async ({ candidate }) => {
    await addOrQueueCandidate(candidate);
});

socket.on("call:end", () => {
    console.log("Call ended by peer");
    cleanupCall();
});

socket.on("disconnect", cleanupCall);
