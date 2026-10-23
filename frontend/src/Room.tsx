import { on } from "events";
import { use, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";

const URL = "http://localhost:3000";

export const Room = ({
    name,
    localAudioTrack,
    localVideoTrack
}:{
    name:string,
    localAudioTrack: MediaStreamTrack | null,
    localVideoTrack: MediaStreamTrack | null
}) => {
    const [searchParams,setSearchParams] = useSearchParams();
    const [lobby,setLobby] = useState(true);
    const [socket,setSocket] = useState<null | Socket>(null);
    const [sendingPc,setSendingPc] = useState<null | RTCPeerConnection>(null);
    const [receivingPc,setReceivingPc] = useState<null | RTCPeerConnection>(null);
    const [remoteVideoTrack,setRemoteVideoTrack] = useState<null | MediaStreamTrack>(null);
    const [remoteAudioTrack,setRemoteAudioTrack] = useState<null | MediaStreamTrack>(null);
    const [remoteMediaStream,setRemoteMediaStream] = useState<null | MediaStream>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>();
    const localVideoRef = useRef<HTMLVideoElement>();

    useEffect(() => {
        const socket = io(URL);


        socket.on("send-offer",async ({roomId}) =>{
            alert("send offer please");
            setLobby(false);
            
            const pc = new RTCPeerConnection();
            setSendingPc(pc);

            if(localAudioTrack){
                pc.addTrack(localAudioTrack);
            }
            if(localVideoTrack){
                pc.addTrack(localVideoTrack);
            }

            pc.onicecandidate = async (e) => {
                if(e.candidate){
                    socket.emit("add-ice-candidate",{
                        candidate: e.candidate,
                        type:"sender"
                    })
                    // pc.addIceCandidate(e.candidate);
                }
            }

            pc.onnegotiationneeded = async()=>{
                const sdp = await pc.createOffer();
                //@ts-ignore
                pc.setLocalDescription(sdp)
                socket.emit("offer",{
                    sdp ,
                    roomId
                })
            }

        })

        socket.on("offer",async ({roomId,sdp: remoteSdp}) =>{
            alert("send offer please");
            setLobby(false);

            const pc = new RTCPeerConnection();

            pc.setRemoteDescription(remoteSdp);

            const sdp = await pc.createAnswer();
            //@ts-ignore
            pc.setLocalDescription(sdp)

            const stream = new MediaStream();
            if(remoteVideoRef){
                remoteVideoRef.current.srcObject = stream;
            }
            setRemoteMediaStream(stream);
            //trickle ice

            setReceivingPc(pc);

            pc.onicecandidate = async (e) => {
                if(e.candidate){
                    socket.emit("add-ice-candidate",{
                        candidate: e.candidate,
                        type:"receiver"
                    })
                    // pc.addIceCandidate(e.candidate);
                }
            }

            pc.ontrack = (({track,type}) => {
                if(type == 'audio'){
                    // setRemoteAudioTrack(track)
                    //@ts-ignore
                    remoteVideoRef.current.srcObject.addTrack(track);
                }else{
                    // setRemoteVideoTrack(track);
                    //@ts-ignore
                    remoteVideoRef.current.srcObject.addTrack(track);
                }

                remoteVideoRef.current.play();
            })

            socket.emit("answer",{
                sdp,
                roomId
            })
        })

        socket.on("answer",({roomId,sdp: remoteSdp}) =>{
            alert("connection done");
            setLobby(false);
            setSendingPc(pc => {
                pc?.setRemoteDescription(remoteSdp)
                return pc
            })
        })

        socket.on("lobby",()=>{
            setLobby(true);
        })

        socket.on("add-ice-candidate",({candidate,type}) => {
            if(type == "sender"){
                setReceivingPc(pc => {
                    pc?.addIceCandidate(candidate)
                    return pc;
                })
            }else{
                setReceivingPc(pc => {
                    pc?.addIceCandidate(candidate)
                    return pc;
                })
            }
        })

        setSocket(socket);

    },[name])

    useEffect(()=>{
        if(localVideoRef.current){
            if(localVideoTrack){
                localVideoRef.current.srcObject = new MediaStream([localVideoTrack]);
                localVideoRef.current.play();
            }
        }
    },[localVideoRef])

    return <div>
        Hi {name}
        <video autoPlay width={400} height={400} ref={localVideoRef}/>
        {lobby ? "Waiting to connect you to some one" : null}
        <video autoPlay width={400} height={400} ref={remoteVideoRef}/>
    </div>
}