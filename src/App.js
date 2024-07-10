import "./App.css"
import React, { useRef, useState } from 'react';

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
    const [isLoading, setIsLoading] = useState(false)
    const webcamRef = useRef(null)

    const isMobileDevice = () => {
        return window.innerWidth <= 800 && window.innerHeight <= 1280;
    };

    const capture = async () => {
        setIsLoading(true)
        const imageSrc = webcamRef.current.getScreenshot()

		const prompt = "find object in the image and where it is placed(if aisle details available, then respond only aisle details)?. Give response in this format {'objectName': 'value','location':'value'}";
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
            alert(jsonResult)

		} catch(e) {
			console.log('GAI ERROR: ', e)
		} finally {
            setIsLoading(false)
        }
    }

    const videoConstraints = isMobileDevice() ? {
        facingMode: { exact:  "environment" }
    } : {
        facingMode: "user"
    }

    return (
        <div className="App">
            <h1>Esper Edge AI</h1>
            <Webcam
                videoConstraints={videoConstraints}
                audio={false}
                ref={webcamRef}
                // screenshotFormat="image/jpeg"
                width="50%"
            /><br />
            <button className="button-9" onClick={capture}>{isLoading ? 'Loading...' : 'Capture'}</button>
        </div>
    )
}

export default App
