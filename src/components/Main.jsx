import React, { useEffect, useState, useRef, useTransition } from 'react'
import { auth, db, firestore } from '../auth/firebase'
import { storage } from '../auth/firebase'
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { onValue, ref, set, push, limitToLast, query } from 'firebase/database'
import { collection, addDoc, getDoc, where, doc, setDoc } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { nanoid } from 'nanoid'
import ClipIcon from '../assets/ClipIcon'
import SendIcon from '../assets/SendIcon'
import DownloadIcon from '../assets/DownloadIcon'
import CopyIcon from '../assets/CopyIcon'
import Profile from './Profile'
import { useStateContext } from '../context/StateContext'
import { onAuthStateChanged } from 'firebase/auth'
import GoogleIcon from '../assets/GoogleIcon'
import useFunction from '../hooks/useFunction'
import { async } from '@firebase/util'
import NewUser from './NewUser'
import CloseIcon from '../assets/CloseIcon'
import BackIcon from '../assets/BackIcon'

export default function Main({ currentChat, setCurrentChat }) {
    const { logIn, currentUser } = useAuth()
    const { handleEncryptFile, handleDecryptFile, handleEncrypt, handleEncryptWithKey, handleDecrypt, handleDecryptWithKey, handleEncryptText, handleDecryptText, handleLocalKeys } = useFunction();
    const sharechatRef = useRef(null)
    const [isPending, startTransition] = useTransition();
    const [data, setData] = useState([])
    const [text, setText] = useState("")
    const [file, setFile] = useState(null)
    const [fileUploadStart, setFileUploadStart] = useState(false)
    const [fileUploadProgress, setFileUploadProgress] = useState(0)
    const [fileDownloadStart, setFileDownloadStart] = useState(false)
    const [fileDownloadProgress, setFileDownloadProgress] = useState(0)
    const [currentDownloadFileName, setCurrentDownloadFileName] = useState("")
    const [displayCopied, setDisplayCopied] = useState(false)
    const [loading, setLoading] = useState(true)
    const [displayChosenFile, setDisplayChosenFile] = useState(false)
    //
    const handleBack = () => {
        startTransition(() => {
            setData([])
            setFile(null)
            setFileUploadStart(false)
            setFileUploadProgress(0)
            setFileDownloadStart(false)
            setFileDownloadProgress(0)
            setCurrentDownloadFileName("")
            setDisplayCopied(false)
            setLoading(true)
            setDisplayChosenFile(false)
            setText("")
            setCurrentChat({})
        })
    }
    //
    const handleSubmit = async (e) => {
        e.preventDefault()
        const uid1 = !currentChat.sender ? currentUser.uid : currentChat.uid;
        const uid2 = currentChat.sender ? currentUser.uid : currentChat.uid;
        console.log(uid1, uid2)
        console.log(text, file)
        if (file === null && text !== "") {
            const key = nanoid()
            const encryptedText = await handleEncryptText(text, key);
            const message = {
                text: {
                    text: encryptedText,
                    [currentUser.uid]: handleEncrypt(key),
                    [currentChat.uid]: handleEncryptWithKey(key, currentChat.publicKey)
                },
                sender: currentUser.uid
            }
            console.log(message)
            push(ref(db, `chats/${uid1}/${uid2}`), message).then((d) => {
                console.log(d);
                setText("")
            }).catch((e) => {
                console.log(e)
            })
        } else if (file !== null) {
            const key = nanoid()
            handleEncryptFile(file, key).then((encryptedFile) => {
                console.log(encryptedFile)
                const storageReff = storageRef(storage, `${uid1}/${uid2}/${nanoid()}`);
                const uploadTask = uploadBytesResumable(storageReff, encryptedFile)
                uploadTask.on('state_changed',
                    (snapshot) => {
                        setDisplayChosenFile(false)
                        setFileUploadStart(true)
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        setFileUploadProgress(progress)
                        console.log('Upload is ' + progress + '% done');
                        switch (snapshot.state) {
                            case 'paused':
                                console.log('Upload is paused');
                                break;
                            case 'running':
                                console.log('Upload is running');
                                break;
                        }
                    },
                    (error) => {
                        switch (error.code) {
                            case 'storage/unauthorized':
                                break;
                            case 'storage/canceled':
                                break;
                            case 'storage/unknown':
                                break;
                        }
                    },
                    () => {
                        getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
                            const encryptedText = text !== "" ? await handleEncryptText(text, key) : "";
                            const message = {
                                text: {
                                    text: encryptedText,
                                    [currentUser.uid]: handleEncrypt(key),
                                    [currentChat.uid]: handleEncryptWithKey(key, currentChat.publicKey)
                                },
                                file: {
                                    file_name: await handleEncryptText(file.name, key),
                                    [currentUser.uid]: handleEncrypt(key),
                                    [currentChat.uid]: handleEncryptWithKey(key, currentChat.publicKey),
                                    url: downloadURL
                                },
                                sender: currentUser.uid
                            }
                            push(ref(db, `chats/${uid1}/${uid2}`,), message).then((d) => {
                                console.log(d);
                                setText("")
                                setFile(null)
                                setFileUploadProgress(0)
                                setFileUploadStart(false)
                            }).catch((e) => {
                                console.log(e)
                                setFileUploadProgress(0)
                                setFileUploadStart(false)
                            })
                        });
                    }
                );
            })
        } else {
            alert("Please enter text or upload a file")
        }
    }
    //
    const handleFileChange = (e) => {
        if (e.target.files[0].size > 5000000) {
            alert("File size is too big")
        } else {
            setFile(e.target.files[0])
            setDisplayChosenFile(true)
        }
    }
    //
    const handleFileDownload = (name, url, key) => {
        setFileDownloadStart(true)
        setCurrentDownloadFileName(name)
        console.log(name, url)
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onprogress = (event) => {
            setFileDownloadProgress((event.loaded / event.total) * 100)
        };
        xhr.onload = (event) => {
            const blob = xhr.response;
            const responseFile = new File([blob], name);
            handleDecryptFile(responseFile, handleDecrypt(key)).then((decryptedFile) => {
                console.log(decryptedFile, handleDecrypt(key))
                const responseBlob = new Blob([decryptedFile]);
                const a = document.createElement('a');
                a.href = window.URL.createObjectURL(responseBlob);
                a.download = name;
                a.click();
                setFileDownloadProgress(0)
                setFileDownloadStart(false)
            })
        };
        xhr.open('GET', url);
        xhr.send();
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
    const handleText = (text) => {
        const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
        const renderText = (t) =>
            t
                .split(" ")
                .map(part =>
                    URL_REGEX.test(part) ? <div className=""> <a className="transition-colors text-blue-300 hover:text-blue-500 hover:underline" href={part} target="_blank" rel="noopener noreferrer">{part} </a> <span className="w-3 h-3 cursor-pointer inline-block" onClick={() => handleCopy(part)}><CopyIcon size={3} /></span> </div> : part + " "
                );
        return renderText(text)
    }
    //
    const handleNew = async (data, keys, chat = []) => {
        await new Promise((resolve) => {
            const uid1 = !currentChat.sender ? currentUser.uid : currentChat.uid;
            const uid2 = currentChat.sender ? currentUser.uid : currentChat.uid;
            console.log(uid1, uid2)
            console.log(data)
            data.forEach(async (d, i) => {
                const key = handleDecrypt(d.text[currentUser.uid])
                await handleDecryptText(d.text.text, key).then(async (decryptedText) => {
                    // if (d.file !== undefined) {
                    console.log(d)
                    await handleDecryptText(d?.file?.file_name, key).then((decryptedFileName) => {
                        console.log(decryptedText, decryptedFileName)
                        let object = {
                            text: decryptedText,
                            file: {
                                file_name: decryptedFileName,
                                file_key: d?.file?.[currentUser.uid],
                                url: d?.file?.url
                            },
                            index: keys[i],
                            sender: d?.sender === currentUser.uid ? true : false,
                        }
                        chat.push(object)
                    })
                })
                if (data.length - 1 === i) {
                    resolve(console.log("done"))
                }
            })
        });
        return chat
    }
    //
    useEffect(() => {
        if (currentUser) {
            console.log(currentChat)
            const uid1 = !currentChat.sender ? currentUser.uid : currentChat.uid;
            const uid2 = currentChat.sender ? currentUser.uid : currentChat.uid;
            console.log(uid1, uid2)
            if (localStorage.getItem(currentChat.uid) === null) {
                const q = ref(db, `chats/${uid1}/${uid2}`);
                return onValue(q, async (snapshot) => {
                    if (snapshot.exists()) {
                        let data = await handleNew(Object.values(snapshot.val()), Object.keys(snapshot.val()))
                        console.log(data)
                        startTransition(() => {
                            setData(() => data);
                        })
                        localStorage.setItem(currentChat.uid, JSON.stringify(data))
                    } else {
                        console.log("no data")
                    }
                });
            } else {
                let ls = JSON.parse(localStorage.getItem(currentChat.uid))
                startTransition(() => {
                    setData(ls);
                })
                console.log("hehe")
                const q = query(ref(db, `chats/${uid1}/${uid2}`), limitToLast(1));
                return onValue(q, async (snapshot) => {
                    ls = JSON.parse(localStorage.getItem(currentChat.uid))
                    if (snapshot.exists()) {
                        console.log("hOHO", Object.keys(snapshot.val())[0], ls[ls.length - 1].index)
                        if (Object.keys(snapshot.val())[0] !== ls[ls.length - 1].index) {
                            console.log(snapshot.val())
                            let data = await handleNew(Object.values(snapshot.val()), Object.keys(snapshot.val()), ls)
                            startTransition(() => {
                                setData(data);
                            })
                            localStorage.setItem(currentChat.uid, JSON.stringify(data))
                        }
                    }
                })
            }
        }
    }, [currentUser]);
    //
    useEffect(() => {
        if (!isPending) {
            if (sharechatRef.current !== null) {
                sharechatRef.current.scrollTop = sharechatRef.current.scrollHeight;
            }
        }
    }, [isPending]);
    //
    useEffect(() => {
        window.addEventListener("resize", (e) => {
            if (sharechatRef.current !== null) {
                sharechatRef.current.scrollTop = sharechatRef.current.scrollHeight;
            } 
        })
    })
    //
    return (
        <>
            <nav className="w-full h-10 bg-[color:var(--bg-secondary)] flex justify-center items-center relative">
                <button onClick={handleBack} className="w-10 h-10 absolute left-2"><div className="w-6 h-6"><BackIcon /></div></button>
                <h1 className="w-full h-full flex justify-center items-center text-center">
                    {currentChat.username}
                </h1>
            </nav>
            <div className="share_chat overflow-auto w-full h-[calc(100%_-_96px)] flex flex-col pt-2 pr-2 pl-2" ref={sharechatRef}>
                {data && data.map((d) => (
                    <div key={nanoid()} className={`w-full flex  ${d.sender ? "justify-end" : "justify-start"}`}>
                        <div className="received file_text_container w-fit rounded-lg bg-[color:var(--bg-secondary)] mb-2 pb-2 pt-2 overflow-hidden">
                            {
                                d.text &&
                                <p className="mr-2 ml-2 break-all text-justify">{d.text.length >= 200 ?
                                    <>{handleText(d.text.slice(0, 200))}
                                        <span className="text-blue-300">...more</span>
                                    </> :
                                    handleText(d.text.slice(0, 200))}
                                </p>
                            }
                            {
                                d.file.file_name &&
                                <div className="flex bg-[color:var(--bg-secondary)] justify-start items-center">
                                    <div className="flex">
                                        <p className=" mr-2 ml-2 transition-colors text-blue-300">{d.file.file_name}</p>
                                    </div>
                                    <button className="w-5 h-5 mr-2 ml-2" onClick={() => handleFileDownload(d.file.file_name, d.file.url, d.file.file_key)}><DownloadIcon /></button>
                                </div>
                            }
                        </div>
                    </div>
                ))
                }
            </div>
            <div className="input_container w-full relative">
                {
                    fileUploadStart &&
                    <div className="w-1/2 h-20 bg-[color:var(--bg-secondary)] absolute top-0 right-3 -translate-y-20 flex flex-col p-2 rounded-lg">
                        <div className="flex justify-center items-center">
                            <div className="w-3 h-3"><ClipIcon size={2} /></div>
                            <p className="truncate">{file?.name}</p>
                        </div>
                        <p className="w-full text-center">{Math.round(fileUploadProgress)}%</p>
                        <div className="w-full h-3 bg-[color:var(--bg-primary)]  rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full transition-all" style={{ width: `${fileUploadProgress}%` }}></div>
                        </div>
                    </div>
                }
                {
                    fileDownloadStart &&
                    <div className="w-1/2 h-20 bg-[color:var(--bg-secondary)] absolute top-0 right-3 -translate-y-20 flex flex-col p-2 rounded-lg">
                        <div className="flex justify-center items-center">
                            <div className="w-3 h-3"><ClipIcon size={2} /></div>
                            <p className="truncate">{currentDownloadFileName}</p>
                        </div>
                        <p className="w-full text-center">{Math.round(fileDownloadProgress)}%</p>
                        <div className="w-full h-3 bg-[color:var(--bg-primary)]  rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full transition-all" style={{ width: `${fileDownloadProgress}%` }}></div>
                        </div>
                    </div>
                }
                {
                    displayChosenFile &&
                    <div className="w-1/2 h-20 bg-[color:var(--bg-secondary)] absolute top-0 right-3 -translate-y-20 flex flex-col justify-center p-2 rounded-lg">
                        <p className="w-full text-center">Selected File</p>
                        <div className="flex justify-center items-center">
                            <div className="w-3 h-3"><ClipIcon size={2} /></div>
                            <p className="truncate">{file?.name}</p>
                        </div>
                        <button className="w-4 h-4 absolute top-3 right-3" onClick={() => { setFile(null); setDisplayChosenFile(false) }}><CloseIcon /></button>
                    </div>
                }
                {
                    displayCopied &&
                    <div className="w-28 h-10 bg-[color:var(--bg-secondary)] absolute top-0 right-3 -translate-y-20 flex flex-col p-2 rounded-lg">
                        <p className="w-full text-center">Copied!</p>
                    </div>
                }
                <form onSubmit={(e) => handleSubmit(e)} className="w-full flex justify-center items-center relative p-2">
                    <div className="w-full h-10 relative flex justify-center items-center overflow-hidden rounded-full">
                        <input className="w-full bg-[color:var(--bg-secondary)] h-10 rounded-full outline-none pl-3 pr-10" placeholder="Enter..." value={text} onChange={(e) => setText(e.target.value)} type={"text"} />
                        <div className="w-10 h-10 file_button_container absolute right-0">
                            <input className="w-10 h-10 absolute opacity-0" type={"file"} onChange={(e) => handleFileChange(e)} />
                            <button className="flex justify-center items-center w-10 h-10 absolute pointer-events-none"><div className="w-6 h-6"><ClipIcon /></div></button>
                        </div>
                    </div>
                    <button className="flex justify-center items-center rounded-full w-10 h-10 bg-[color:var(--bg-secondary)] ml-2" type={"submit"}><SendIcon /></button>
                </form>
            </div>
        </>
    )
}
