import React, { useEffect, useState } from 'react'
import { useStateContext } from '../context/StateContext'
import { useAuth } from '../context/AuthContext'
import NewUser from './NewUser'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db, firestore } from '../auth/firebase'
import GoogleIcon from '../assets/GoogleIcon'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import Profile from './Profile'
import CloseIcon from '../assets/CloseIcon'
import { limitToLast, onValue, push, query, ref } from 'firebase/database'
import { nanoid } from 'nanoid'
import useFunction from '../hooks/useFunction'
import Main from './Main'
import SearchUser from './SearchUser'

export default function Home() {
    const { logIn, currentUser } = useAuth()
    const { loggedIn, setLoggedIn } = useStateContext()
    const { handleEncryptText, handleEncrypt } = useFunction();
    const [loading, setLoading] = useState(true)
    const [profileExists, setProfileExists] = useState(false)
    const [update, setUpdate] = useState(false)
    const [profile, setProfile] = useState(false)
    const [chats, setChats] = useState([])
    const [currentChat, setCurrentChat] = useState({})
    const [searchUser, setSearchUser] = useState(false)

    if (currentUser) {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                setLoggedIn(true)
            } else {
                setLoggedIn(false)
            }
        })
    }
    //
    const handleGetUserInfo = async (chatUIDS, chatUIDS1, chats = []) => {
        await new Promise((resolve) => {
            chatUIDS.forEach(async (uid, i) => {
                console.log(uid)
                const docRef = doc(firestore, "users", uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    let chat = {
                        uid: uid,
                        username: currentUser.uid === uid ? "My Void" : docSnap.data().username,
                        publicKey: docSnap.data().publicKey,
                        sender: false
                    }
                    if (chatUIDS.length - 1 === i) {
                        console.log("hmm", chatUIDS1)
                        if (chatUIDS1.length !== 0) {
                            chatUIDS1.forEach(async (uid, i) => {
                                const docRef = doc(firestore, "users", uid);
                                const docSnap = await getDoc(docRef);
                                if (docSnap.exists()) {
                                    let chat = {
                                        uid: uid,
                                        username: currentUser.uid === uid ? "My Void" : docSnap.data().username,
                                        publicKey: docSnap.data().publicKey,
                                        sender: true
                                    }
                                    if (chatUIDS1.length - 1 === i) {
                                        resolve(console.log("done"))
                                    }
                                    chats.push(chat)
                                } else {
                                }

                            })
                        } else {
                            resolve(console.log("done"))
                        }
                    }
                    chats.push(chat)
                } else {
                }
            })
        });
        return chats
    }
    //
    const handleChats = () => {
        if (localStorage.getItem("chats") === null) {
            const q = ref(db, `chats/${currentUser.uid}`);
            return onValue(q, async (snapshot) => {
                if (snapshot.exists()) {
                    const chatsUIDS = Object.keys(snapshot.val())
                    const chatDoc = doc(firestore, "mychats", currentUser.uid);
                    const chatDocSnap = await getDoc(chatDoc);
                    let uids = Object.keys(chatDocSnap.data())
                    uids.splice(uids.indexOf(currentUser.uid),1)
                    const chats = await handleGetUserInfo(chatsUIDS, uids);
                    console.log(chats, chatsUIDS, uids)
                    setChats(chats)
                    // localStorage.setItem("chats", JSON.stringify(chats))
                    setLoading(false)
                } else {
                    const key = nanoid()
                    const encryptedText = await handleEncryptText("Welcome To ShareVoid!", key);
                    const message = {
                        text: {
                            text: encryptedText,
                            [currentUser.uid]: handleEncrypt(key),
                        }
                    }
                    const q = ref(db, `chats/${currentUser.uid}/${currentUser.uid}`);
                    push(q, message).then((request) => {
                        setLoading(false)
                        const mychats = doc(firestore, "mychats", currentUser.uid);
                        const u = {
                            [currentUser.uid]: {
                                uid: currentUser.uid,
                            }
                        }
                        setDoc(mychats, u).then(
                            console.log("Documemt set")
                        )
                    })
                }
            });
        } else {
            const ls = JSON.parse(localStorage.getItem("chats"))
            setChats(ls)
            setLoading(false)
            const q = query(ref(db, `chats/${currentUser.uid}`), limitToLast(1));
            return onValue(q, async (snapshot) => {
                if (snapshot.exists()) {
                    const chatsUIDS = Object.keys(snapshot.val())
                    if (chatsUIDS[0] !== ls[ls.length - 1].uid) {
                        const chats = await handleGetUserInfo(chatsUIDS, ls);
                        console.log(chats)
                        setChats(chats)
                        localStorage.setItem("chats", JSON.stringify(chats))
                    } else {
                        console.log("Already up to date")
                    }
                } else {
                    console.log("Something went wrong")
                }
            });
        }
    }
    //
    useEffect(() => {
        if (currentUser) {
            if (loggedIn) {
                const docRef = doc(firestore, "users", currentUser.uid);
                const docSnap = getDoc(docRef)
                docSnap.then((doc) => {
                    if (doc.exists()) {
                        setProfileExists(true)
                        handleChats()
                    } else {
                        console.log("No such document!");
                        setLoading(false)
                    }
                }).catch((error) => {
                    console.log("Error getting document:", error);
                });
            }
        } else {
            setLoading(false)
        }
    }, [loggedIn, update])
    //
    return (
        <section className="w-full h-full bg-[color:var(--bg-primary)] flex flex-col justify-start items-center relative overflow-hidden">
            {
                Object.keys(currentChat).length === 0 &&
                <nav className="w-full h-10 bg-[color:var(--bg-secondary)] flex justify-center items-center">
                    <h1 className="w-full h-full flex justify-center items-center text-center">
                        ShareVoid
                    </h1>
                    {
                        currentUser && loggedIn &&
                        <div className="profile_img_container h-10 flex justify-center items-center absolute top-0 right-2">
                            <button className="h-full w-8" onClick={() => setProfile(true)}>
                                <img className="rounded-full" src={currentUser.photoURL} />
                            </button>
                        </div>
                    }
                </nav>
            }
            {
                profile && <Profile currentUser={currentUser} setProfile={setProfile} />
            }
            {
                searchUser && <SearchUser />
            }
            {
                currentUser && loggedIn ?
                    loading ?
                        <h1>Loading...</h1>
                        :
                        !profileExists ?
                            <NewUser setUpdate={setUpdate} />
                            :

                            Object.keys(currentChat).length === 0 ?
                                <>

                                    <button onClick={() => setSearchUser(true)} className="w-14 h-14 flex justify-center items-center bg-[color:var(--bg-secondary)] absolute bottom-3 right-3 rounded-full">
                                        <div className="w-7 h-7 rotate-45"><CloseIcon /></div>
                                    </button>
                                    <div className="chats_container w-full h-[calc(100%_-_40px)] overflow-auto flex flex-col justify-start items-center">
                                        {
                                            chats && chats.map((chat, i) => (
                                                <div onClick={() => setCurrentChat(chat)} key={nanoid()} className="chat_container w-[calc(100%_-_15px)] mt-3 p-2 rounded-lg h-20 bg-[color:var(--bg-secondary)] flex justify-start items-center ">
                                                    <div className="profile_img_container h-14 w-14 flex justify-center items-center bg-gray-900 rounded-full">
                                                    </div>
                                                    <div className="chat_container flex flex-col justify-center items-start ml-3">
                                                        <h3>{chat.username}</h3>
                                                        <p>Message</p>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </> : <Main currentChat={currentChat} setCurrentChat={setCurrentChat} />
                    : <div className="absolute w-full h-full flex justify-center items-center">
                        <button onClick={logIn} className="bg-[color:var(--bg-secondary)] pt-1 pb-1 pr-4 pl-4 flex justify-center items-center rounded-full">
                            <span>Log In Using</span>
                            <div className="w-4 ml-2">
                                <GoogleIcon size={4} />
                            </div>
                        </button>
                    </div>
            }
        </section>
    )
}
