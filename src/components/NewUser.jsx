import React, { useEffect, useState, useTransition } from 'react'
import useFunction from '../hooks/useFunction'
import CopyIcon from '../assets/CopyIcon'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { async } from '@firebase/util'
import { firestore } from '../auth/firebase'
import { useAuth } from '../context/AuthContext'

export default function NewUser({ setUpdate }) {
    const { handleGenerateKey, handleDownloadJSON } = useFunction()
    const [isPending, startTransition] = useTransition()
    const { currentUser } = useAuth()
    const [username, setUsername] = useState("")
    const [keyDownloaded, setKeyDownloaded] = useState(false)
    const [displayCopied, setDisplayCopied] = useState(false)
    const [warning, setWarning] = useState("")
    const [isWarning, setIsWarning] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [loading, setLoading] = useState(false)
    const [key, setKey] = useState({ publicKey: '', privateKey: '' })
    // const handleKey = () => {
    //     set
    // }
    const handleSubmit = async (e) => {
        e.preventDefault()
        startTransition(() => {
            setWarning("")
            setIsWarning(false)
        })
        const usernameRegex = /^[a-z][a-z0-9_.]*$/;
        if (username.length >= 3 && username.length <= 15 && usernameRegex.test(username)) {
            if (keyDownloaded) {
                localStorage.setItem("publicKey", key.publicKey)
                localStorage.setItem("privateKey", key.privateKey)
                const publicUserRef = doc(firestore, "public_users", username);
                const publicUserExits = await getDoc(publicUserRef);
                if (publicUserExits.exists()) {
                    console.log("Username already exists")
                    startTransition(() => {
                        setWarning("Username already exists!")
                        setIsWarning(true);
                    })
                } else {
                    setSubmitting(true)
                    const docRef = doc(firestore, "users", currentUser.uid);
                    await setDoc(docRef, { username: username, publicKey: key.publicKey, uid: currentUser.uid, photoURL: currentUser.photoURL })
                    await setDoc(publicUserRef, { publicKey: key.publicKey, uid: currentUser.uid, username: username, photoURL: currentUser.photoURL })
                    setUpdate((update) => !update)
                    setSubmitting(false)
                }
            } else {
                console.log("Please download your key pair first!")
                startTransition(() => {
                    setWarning(`Click below button to "Generate RSA Key Pair!"`)
                    setIsWarning(true);
                })
            }
        } else {
            console.log("Username must be between 3 and 15 characters, must not contain special characters and should not start with a number!")
            startTransition(() => {
                setWarning("Username must be between 3 and 15 characters, must not contain special characters and should not start with a number!")
                setIsWarning(true);
            })
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
            {
                displayCopied &&
                <div className="w-28 h-10 bg-[color:var(--bg-secondary)] absolute bottom-0 right-3 -translate-y-20 flex flex-col p-2 rounded-lg z-10">
                    <p className="w-full text-center">Copied!</p>
                </div>
            }
            {
                submitting &&
                <div className="w-full h-full bg-[color:var(--bg-primary-semi-transparent)] absolute top-0 left-0 flex justify-center items-center z-10">
                    <p className="">Submitting...</p>
                </div>
            }
            <form onSubmit={(e) => handleSubmit(e)} className="flex flex-col w-11/12 p-3 mt-7 border-4 border-[color:var(--bg-secondary)] rounded-lg">
                <label htmlFor="username" className="font-bold" >Username:</label>
                <div className="input_container w-full mt-1 relative flex justify-center items-center">
                    <input value={username} onChange={(e) => { setUsername(e.target.value); setWarning(false) }} type="text" minLength={3} maxLength={15} placeholder="Enter Username..." className="w-full bg-[color:var(--bg-secondary)] h-10 rounded-full outline-none pl-3 pr-3" name="username" id="username" required />
                    <p className="absolute right-2 text-[color:var(--text-secondary)]">{username.length}/15</p>
                </div>
                {
                    isWarning &&
                    <p className="w-full bg-[color:var(--bg-secondary)] p-3 rounded-lg text-justify text-red-500 mt-3">{warning}</p>
                }
                <button className="w-full mt-3 mb-2 pt-0 pb-1 pr-2 pl-2 rounded-full bg-blue-700" type="button" onClick={() => { setKey(handleGenerateKey()); setLoading(true); setKeyDownloaded(false) }}>Generate RSA Key Pair</button>
                {
                    loading ? <p>Loading...</p> :
                        key.publicKey && key.privateKey &&
                        <>
                            <label htmlFor="publicKey" className="mt-2 font-bold">Public Key:</label>
                            <div className="textarea_container relative flex justify-center items-center mt-1">
                                <textarea className="w-full bg-[color:var(--bg-secondary)] h-36 rounded-lg outline-none mb-2 pl-3 pr-10 resize-none" name="publicKey" id="publicKey" value={key.publicKey} readOnly />
                                <button className="w-7 h-7 absolute right-2" type="button" onClick={() => handleCopy(key.publicKey)}><CopyIcon size={"full"} /></button>
                            </div>
                            <label htmlFor="privateKey" className="mt-2 font-bold">Private Key:</label>
                            <div className="textarea_container relative flex justify-center items-center mt-1">
                                <textarea className="w-full bg-[color:var(--bg-secondary)] h-36 rounded-lg outline-none mb-2 pl-3 pr-10 resize-none" name="privateKey" id="privateKey" value={key.privateKey} readOnly />
                                <button className="w-7 h-7 absolute right-2" type="button" onClick={() => handleCopy(key.privateKey)}><CopyIcon size={"full"} /></button>
                            </div>
                            {
                                !keyDownloaded ?
                                    <div className="w-full mb-2 mt-2 pt-0 pb-1 pr-2 pl-2 rounded-full bg-blue-700 text-center" onClick={() => {
                                        handleDownloadJSON(key.privateKey, "Private Key")
                                        setKeyDownloaded(true)
                                    }}>Download Private Pair</div> :
                                    <button className="w-full mb-2 mt-2 pt-0 pb-1 pr-2 pl-2 rounded-full bg-green-600" type="submit">Create Account</button>
                            }
                        </>
                }
            </form>
        </>
    )
}
