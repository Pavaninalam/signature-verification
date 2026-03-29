import React, {useState} from "react";
import axios from "axios";

function Upload(){

const [file,setFile] = useState(null)
const [result,setResult] = useState("")

const handleSubmit = async () => {

let formData = new FormData()

formData.append("signature",file)

const response = await axios.post(
"http://127.0.0.1:8000/verify/",
formData
)

setResult(response.data.result)

}

return(

<div>

<h2>Signature Verification</h2>

<input
type="file"
onChange={(e)=>setFile(e.target.files[0])}
/>

<button onClick={handleSubmit}>
Verify Signature
</button>

<h3>{result}</h3>

</div>

)

}

export default Upload