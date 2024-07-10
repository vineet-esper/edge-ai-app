import "./App.css"
import React, { useRef } from 'react';

import Webcam from "react-webcam"
import { GoogleGenerativeAI } from "@google/generative-ai";
import { initializeApp } from "firebase/app";
import { v4 as uuidv4 } from 'uuid';
import { getDatabase, ref, set } from "firebase/database";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE,
  authDomain: "edgeai-demo.firebaseapp.com",
  databaseURL: "https://edgeai-demo-default-rtdb.firebaseio.com",
  projectId: "edgeai-demo",
  storageBucket: "edgeai-demo.appspot.com",
  messagingSenderId: "138279348409",
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Access your API key (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GAI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

console.log(process.env.REACT_APP_GAI_API_KEY)
function App() {
    const webcamRef = useRef(null)

    const capture = async () => {
        const imageSrc = webcamRef.current.getScreenshot()

		const prompt = "Can you detect objects and where they are located? Respond in stringified JSON form {objectName: 'value', location: 'value'}";
		const image = {
		inlineData: {
			data: imageSrc.replace('data:', '').replace(/^.+,/, ''),
			mimeType: "image/webp",
		},
		};

		try {
			const result = await model.generateContent([prompt, image]);
			const jsonResult = result.response.text();
			console.log(jsonResult)
			const id = uuidv4()
			
			set(ref(database, 'inferences/' + id), JSON.parse(jsonResult));
		} catch(e) {
			console.log('GAI ERROR: ', e)
		}
    }

    return (
        <div className="App">
            <h1>Esper Edge AI</h1>
            <Webcam
                audio={false}
                ref={webcamRef}
                // screenshotFormat="image/jpeg"
                width="50%"
            /><br />
            <button className="button-9" onClick={capture}>Capture</button>
        </div>
    )
}

export default App
