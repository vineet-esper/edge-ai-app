import "./App.css"
import React, { useRef, useState } from 'react';

import Webcam from "react-webcam"
import { GoogleGenerativeAI } from "@google/generative-ai";
import { initializeApp } from "firebase/app";
import { v4 as uuidv4 } from 'uuid';
import { getDatabase, ref, set } from "firebase/database";
import { getStorage, ref as storageRef, uploadString } from "firebase/storage";
import { useLongPress } from 'use-long-press';

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
const storage = getStorage();

// Access your API key (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GAI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

console.log(process.env.REACT_APP_GAI_API_KEY)
function App() {
    const [isLoading, setIsLoading] = useState(false)
    const [prompt, setPrompt] = useState('find object in the image and where it is placed(if aisle details available, then respond only aisle details)?')
    const [frontToggleCamera, setFrontToggleCamera] = useState(true)
    const webcamRef = useRef(null)
    const bind = useLongPress(() => {
        let newPrompt = window.prompt("Enter new prompt", "");
        if (newPrompt != null) {
            setPrompt(newPrompt)
          }
      });

    const isMobileDevice = () => {
        return window.innerWidth <= 800  && window.innerHeight <= 1280;
    };

    const capture = async () => {
        setIsLoading(true)
        const imageSrc = webcamRef.current.getScreenshot()

		const reqprompt = `${prompt}. Give response in this JSON strigified format {"objectName": "value","location":"value"}`;
		const image = {
            inlineData: {
                data: imageSrc.replace('data:', '').replace(/^.+,/, ''),
                mimeType: "image/webp",
            },
		};

        const id = uuidv4()


        const stgRef = storageRef(storage, `images/${id}`);
        uploadString(stgRef, imageSrc, 'data_url').then(async (result) => {
            console.log('Uploaded a base64 string!');
            const imageUrl = result.metadata.fullPath

            try {
                const result = await model.generateContent([reqprompt, image]);
                const jsonResult = result.response.text();
                console.log(jsonResult)
                
                set(ref(database, 'inferences/' + id), {...JSON.parse(jsonResult), timestamp: new Date().toISOString(), imageUrl});
                alert(jsonResult)
    
            } catch(e) {
                console.log('GAI ERROR: ', e)
            } finally {
                setIsLoading(false)
            }
        }).catch(e => console.log('upload to storage error: ', e))
    }

    const videoConstraints = !frontToggleCamera ? {
        facingMode: { exact:  "environment" }
    } : {
        facingMode: "user"
    }

    return (
        <div className="App">
            <h1 {...bind()}>Esper Edge AI</h1>
            <Webcam
                videoConstraints={videoConstraints}
                audio={false}
                ref={webcamRef}
                // screenshotFormat="image/jpeg"
                width={isMobileDevice() ? "90%" : "50%"}
            /><br />
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 20}}>
                <button className="button-9" onClick={capture}>{isLoading ? 'Loading...' : 'Capture'}</button>&emsp;
                <button className="button-icon" onClick={() => setFrontToggleCamera(!frontToggleCamera)}>
                    <span class="material-symbols-outlined">flip_camera_android</span>
                </button>
            </div>
        </div>
    )
}

export default App
