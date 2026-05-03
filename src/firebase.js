import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyCaM5m8xhyhIcd0gIjt5_VdeZ-Zu_7sf1w",
  authDomain: "sari-sari-inventory-sys.firebaseapp.com",
  projectId: "sari-sari-inventory-sys",
  storageBucket: "sari-sari-inventory-sys.firebasestorage.app",
  messagingSenderId: "1009527107566",
  appId: "1:1009527107566:web:712d4474d042b8d58fa8ff",
  measurementId: "G-R8S3EBTGD6"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)