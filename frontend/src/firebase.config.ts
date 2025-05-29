import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyATiD6XBxiHuXbuaGGyNRo7XSZXZxBYu70",
    authDomain: "clubly-1480a.firebaseapp.com",
    projectId: "clubly-1480a",
    storageBucket: "clubly-1480a.appspot.com",
    messagingSenderId: "328738289812",
    appId: "1:328738289812:web:32668e354a8f276e9ddc81",
    measurementId: "G-6PQ9J473P1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
        console.error("Error configurando persistencia de autenticación:", error);
    });

export { app, auth };