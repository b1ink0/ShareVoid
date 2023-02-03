import React, { useEffect, useState } from 'react'
import useFunction from '../hooks/useFunction'
import CopyIcon from '../assets/CopyIcon'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { async } from '@firebase/util'
import { firestore } from '../auth/firebase'
import { useAuth } from '../context/AuthContext'

export default function NewUser({setUpdate}) {
    const { handleGenerateKey, handleDownloadJSON } = useFunction()
    const { currentUser } = useAuth()
    const [username, setUsername] = useState("")
    const [keyDownloaded, setKeyDownloaded] = useState(false)
    const [displayCopied, setDisplayCopied] = useState(false)
    const [loading, setLoading] = useState(false)
    const [key, setKey] = useState({ publicKey: '', privateKey: '' })
    // const handleKey = () => {
    //     set
    // }
    const handleSubmit = async (e) => {
        e.preventDefault()
        const usernameRegex = /^[A-Za-z][A-Za-z0-9_.]/;
        if (username.length >= 3 && username.length <= 15 && keyDownloaded && usernameRegex.test(username)) {
            localStorage.setItem("publicKey", key.publicKey)
            localStorage.setItem("privateKey", key.privateKey)
            const publicUserRef = doc(firestore, "public_users", username);
            const publicUserExits = await getDoc(publicUserRef);
            if (publicUserExits.exists()) {
                console.log("Username already exists")
            } else {
                const docRef = doc(firestore, "users", currentUser.uid);
                await setDoc(docRef, { username: username, publicKey: key.publicKey})
                await setDoc(publicUserRef, { publicKey: key.publicKey, uid: currentUser.uid })
                setUpdate((update) => !update)
            }
        }
    }
    //
    const handleCopy = (e) => {
        setDisplayCopied(true)
        setTimeout(() => {
            setDisplayCopied(false)
        }, 1000)
        var input = document.createElement("input");
        input.setAttribute("value", e);
        document.body.appendChild(input);
        input.select();
        var result = document.execCommand("copy");
        document.body.removeChild(input);
        return result;
    };
    //
    useEffect(() => {
        if (key.privateKey && key.publicKey) {
            console.log(key)
            setLoading(false)
        }
    }, [key])
    //
    return (
        <>
            <nav className="flex justify-center items-center w-full h-7 absolute top-0 bg-[color:var(--bg-secondary)]">
                <h1 className="w-full h-7 text-center">
                    ShareVoid
                </h1>
            </nav>
            {
                displayCopied &&
                <div className="w-28 h-10 bg-[color:var(--bg-secondary)] absolute bottom-0 right-3 -translate-y-20 flex flex-col p-2 rounded-lg z-10">
                    <p className="w-full text-center">Copied!</p>
                </div>
            }
            <form onSubmit={(e) => handleSubmit(e)} className="flex flex-col w-full p-3 mt-7 ">
                <label htmlFor="username" >Username:</label>
                <div className="input_container w-full relative flex justify-center items-center">
                    <input value={username} onChange={(e) => setUsername(e.target.value)} type="text" minLength={3} maxLength={15} placeholder="Enter Username..." className="w-full bg-[color:var(--bg-secondary)] h-10 rounded-full outline-none pl-3 pr-3" name="username" id="username" required />
                    <p className="absolute right-2 ">{username.length}/15</p>
                </div>
                <button className="w-full mt-2 mb-2 pt-0 pb-1 pr-2 pl-2 rounded-full bg-green-500" type="button" onClick={() => { setKey(handleGenerateKey()); setLoading(true); setKeyDownloaded(false) }}>Generate Key Pair</button>
                {
                    loading ? <p>Loading...</p> :
                        key.publicKey && key.privateKey &&
                        <>
                            <label htmlFor="publicKey">Public Key:</label>
                            <div className="textarea_container relative flex justify-center items-center">
                                <textarea className="w-full bg-[color:var(--bg-secondary)] h-16 rounded-lg outline-none mb-2 pl-3 pr-10 resize-none" name="publicKey" id="publicKey" value={key.publicKey} readOnly />
                                <button className="w-7 h-7 absolute right-2" type="button" onClick={() => handleCopy(key.publicKey)}><CopyIcon size={"full"} /></button>
                            </div>
                            <label htmlFor="privateKey">Private Key:</label>
                            <div className="textarea_container relative flex justify-center items-center">
                                <textarea className="w-full bg-[color:var(--bg-secondary)] h-16 rounded-lg outline-none mb-2 pl-3 pr-10 resize-none" name="privateKey" id="privateKey" value={key.privateKey} readOnly />
                                <button className="w-7 h-7 absolute right-2" type="button" onClick={() => handleCopy(key.privateKey)}><CopyIcon size={"full"} /></button>
                            </div>
                            {
                                !keyDownloaded ?
                                    <div className="w-full mb-2 pt-0 pb-1 pr-2 pl-2 rounded-full bg-green-500 text-center" onClick={() => {
                                        handleDownloadJSON(key, "KeyPair")
                                        setKeyDownloaded(true)
                                    }}>Download Key Pair</div> :
                                    <button className="w-full mb-2 pt-0 pb-1 pr-2 pl-2 rounded-full bg-red-500" type="submit">Create Account</button>
                            }
                        </>
                }
            </form>
        </>
    )
}
