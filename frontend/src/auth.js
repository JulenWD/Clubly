import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "frontend/src/firebase.config.ts";

export async function login(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const idToken = await user.getIdToken();
    return idToken;
}
