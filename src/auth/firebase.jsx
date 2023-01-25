import { initializeApp } from 'firebase/app';
import { getDatabase } from "firebase/database"
import { getStorage } from "firebase/storage";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyAtM-jtmD7kSjqJzmDNjZSMbUlqnTj-LIA",
    authDomain: "sharevoid.firebaseapp.com",
    projectId: "sharevoid",
    storageBucket: "sharevoid.appspot.com",
    messagingSenderId: "416775881391",
    appId: "1:416775881391:web:701361309dcb64618b8a5a"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth();
export const db = getDatabase(app)
export const storage = getStorage(app);
export const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export const googleHandler = async () => {
    provider.setCustomParameters({ prompt: 'select_account' });
    signInWithPopup(auth, provider)
        .then((result) => {
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            const user = result.user;
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            const email = error.email;
            const credential = GoogleAuthProvider.credentialFromError(error);
        });
};

export const handleSignOut = async () => {
    signOut(auth)
        .then(() => {
            console.log('logged out');
        })
        .catch((error) => {
            console.log(error);
        });
}