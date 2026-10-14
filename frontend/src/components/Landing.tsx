import { useState } from "react"
import { Link } from "react-router-dom";

export const Landing = ()=>{
    const [name,setName] = useState("");
    return <>
        <input className="border-2" type="text" onChange={(e) => {
            setName(e.target.value)
        }} />

        <Link to={`/room/?name=${name}`}>Join Room</Link>
    </>
}