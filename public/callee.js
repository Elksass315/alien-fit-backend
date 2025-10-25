const ICE_SERVERS = [
    { urls: "stun:back-dev.alien-fit.com:3478" },
    {
        urls: "turn:back-dev.alien-fit.com:3478?transport=udp",
        username: "test",
        credential: "testpass"
    },
    {
        urls: "turn:back-dev.alien-fit.com:5349?transport=tcp",
        username: "test",
        credential: "testpass"
    }
];


const socket = io({
    auth: {
        token: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiIwODY0YjE0NC02MmZmLTRiMDItOThkMy1mNTQ0NjdkOWZlNDkiLCJyb2xlIjoiYWRtaW4iLCJzZXNzaW9uSWQiOiIzMDFiZTEwNi0zM2MwLTQ2YjItODg2YS01MjBmMDI1ZjdkMjYiLCJpYXQiOjE3NjE0MTI5NTksImV4cCI6MTc2MTQ2Njk1OX0.oS5fHgdAAFCBcHY4zN3whqI1T8A4kcUG9qtoC108kho"
    }
}); // adjust backend URL if needed

let pc;
let localStream;
let activeUserId;
let pendingRemoteCandidates = [];

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const endBtn = document.getElementById("endCall");

socket.on("connect", () => {
    console.log("Callee connected:", socket.id);
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
    activeUserId = undefined;
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

socket.on("call:offer", async ({ offer, userId }) => {
    console.log("Received offer from user:", userId);

    if (pc) {
        cleanupCall();
    }

    activeUserId = userId;

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
            if (event.candidate && activeUserId) {
                socket.emit("call:ice-candidate", { candidate: event.candidate, target: activeUserId });
            }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await drainPendingCandidates();

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("call:answer", { answer, target: activeUserId });
    } catch (error) {
        console.error("Failed to handle incoming offer", error);
        cleanupCall();
    }
});

endBtn.onclick = () => {
    if (activeUserId) {
        socket.emit("call:end", { target: activeUserId, status: "ended" });
    }
    cleanupCall();
};

socket.on("call:ice-candidate", async ({ candidate, userId }) => {
    if (!pc || (activeUserId && userId && userId !== activeUserId)) {
        return;
    }
    await addOrQueueCandidate(candidate);
});

socket.on("call:end", ({ userId, reason }) => {
    if (!activeUserId || (userId && userId !== activeUserId)) {
        return;
    }

    console.log("Call ended by peer", reason ? `(${reason})` : "");
    cleanupCall();
});

socket.on("disconnect", cleanupCall);
