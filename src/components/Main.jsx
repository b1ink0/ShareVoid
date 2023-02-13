import React, { useEffect, useState, useRef, useTransition } from 'react'
import { auth, db, firestore } from '../auth/firebase'
import { storage } from '../auth/firebase'
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { onValue, ref, set, push, limitToLast, query } from 'firebase/database'
import { useAuth } from '../context/AuthContext'
import { nanoid } from 'nanoid'
import ClipIcon from '../assets/ClipIcon'
import SendIcon from '../assets/SendIcon'
import DownloadIcon from '../assets/DownloadIcon'
import useFunction from '../hooks/useFunction'
import CloseIcon from '../assets/CloseIcon'
import BackIcon from '../assets/BackIcon'
import Skeleton from './Skeleton'
import Message from './sub_components/Message'
import CameraIcon from '../assets/CameraIcon'
import Compress from "compress.js"
import Image from './sub_components/Image'


export default function Main({ currentChat, setCurrentChat }) {
    const { logIn, currentUser } = useAuth()
    const { handleEncryptFile, handleDecryptFile, handleEncrypt, handleEncryptWithKey, handleDecrypt, handleDecryptWithKey, handleEncryptText, handleDecryptText, handleLocalKeys } = useFunction();
    const sharechatRef = useRef(null)
    const inputRef = useRef(null)
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
    const [alert, setAlert] = useState(false)
    const [alertMessage, setAlertMessage] = useState("Sending...")
    const [displayChosenFile, setDisplayChosenFile] = useState(false)
    const [displayChosenImg, setDisplayChosenImg] = useState(false)
    const [chosenImg, setChosenImg] = useState({})
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
            setAlert(false)
        })
    }
    //
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (inputRef.current !== null) {
            inputRef.current.focus()
        }
        const uid1 = !currentChat.sender ? currentUser.uid : currentChat.uid;
        const uid2 = currentChat.sender ? currentUser.uid : currentChat.uid;
        console.log(uid1, uid2)
        console.log(text, file)
        if (file === null && text !== "") {
            setAlert(true)
            setAlertMessage("Encrypting...")
            const key = nanoid()
            const encryptedText = await handleEncryptText(text, key);
            setAlertMessage("Sending...")
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
                setAlert(false)
            }).catch((e) => {
                console.log(e)
                setAlert(false)
            })
        } else if (file !== null) {
            setAlert(true)
            setChosenImg({})
            setAlertMessage("Encrypting...")
            const key = nanoid()
            handleEncryptFile(file, key).then((encryptedFile) => {
                setAlertMessage("Uploading...")
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

                    },
                    () => {
                        getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
                            setAlertMessage("Sending...")
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
                                    url: downloadURL,
                                    img: displayChosenImg
                                },
                                sender: currentUser.uid
                            }
                            push(ref(db, `chats/${uid1}/${uid2}`,), message).then((d) => {
                                console.log(d);
                                setText("")
                                setFile(null)
                                setDisplayChosenImg(false)
                                setChosenImg({})
                                setFileUploadProgress(0)
                                setFileUploadStart(false)
                                setAlert(false)
                            }).catch((e) => {
                                console.log(e)
                                setDisplayChosenImg(false)
                                setChosenImg({})
                                setFileUploadProgress(0)
                                setFileUploadStart(false)
                                setAlert(false)
                            })
                        });
                    }
                );
            }).catch((e) => { setEncrypting(false) })
        } else {
            alert("Please enter text or upload a file")
        }
    }
    //
    const handleFileChange = (e) => {
        if (e.target.files[0].size > 5000000) {
            alert("File size should be less than 5MB!")
        } else {
            setFile(e.target.files[0])
            setDisplayChosenFile(true)
        }
    }
    //
    const handleImageSelection = (e) => {
        if (e.target.files[0].size > 5000000) {
            alert("File size should be less than 5MB!")
        } else {
            const compress = new Compress()
            compress.compress([...e.target.files], {
                size: 4,
                quality: .75,
                maxWidth: 1920,
                maxHeight: 1920,
                resize: true,
                rotate: false,
            }).then(async (data) => {
                const img1 = data[0]
                const base64str = img1.data
                const imgExt = img1.ext
                const file = Compress.convertBase64ToFile(base64str, imgExt)
                file.name = img1.alt
                let object = {
                    name: nanoid(),
                    src: img1.prefix + img1.data
                }
                setChosenImg(object)
                setFile(file)
                setDisplayChosenImg(true)
            })
        }
    }
    //
    const handleFileDownload = (name, url, key) => {
        setAlert(true)
        setAlertMessage("Downloading...")
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
            setAlertMessage("Decrypting...")
            handleDecryptFile(responseFile, handleDecrypt(key)).then((decryptedFile) => {
                setAlertMessage("Done")
                setAlert(false)
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
                                url: d?.file?.url,
                                img: d?.file?.img
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
            const uid1 = !currentChat.sender ? currentUser.uid : currentChat.uid;
            const uid2 = currentChat.sender ? currentUser.uid : currentChat.uid;
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
                const q = query(ref(db, `chats/${uid1}/${uid2}`), limitToLast(1));
                return onValue(q, async (snapshot) => {
                    ls = JSON.parse(localStorage.getItem(currentChat.uid))
                    if (snapshot.exists()) {
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
    }, [])
    //
    return (
        <>
            <nav className="w-full h-10 bg-[color:var(--bg-secondary)] flex justify-center items-center relative">
                <button onClick={handleBack} className="w-10 h-10 md:hidden absolute left-2"><div className="w-6 h-6"><BackIcon /></div></button>
                <h1 className="w-full h-full flex justify-center items-center text-center">
                    {currentChat.username}
                </h1>
                {
                    currentChat.photoURL &&
                    <div className="profile_img_container h-10 flex justify-center items-center absolute top-0 right-2">
                        <button className="h-full w-8">
                            <img className="rounded-full" src={currentChat.photoURL} />
                        </button>
                    </div>
                }
            </nav>
            <div className="share_chat overflow-auto w-full h-[calc(100%_-_96px)] flex flex-col pt-2 pr-2 pl-2" ref={sharechatRef}>
                {data && data.map((d, i) => (
                    <div key={nanoid()} className={`w-full flex  ${d.sender ? "justify-end" : "justify-start"}`}>
                        <div className={` file_text_container w-fit rounded-lg ${!d.sender ? "bg-[color:var(--bg-secondary)]" : "bg-gray-700"} mb-2 pb-2 pt-2 overflow-hidden`}>
                            {
                                d.text &&
                                <Message setDisplayCopied={setDisplayCopied} text={d.text} />
                            }
                            {
                                d.file?.img ?
                                    ""
                                    : d.file.file_name &&
                                    <div className="max-w-full flex flex-wrap justify-start items-center">
                                        <div className="max-w-full">
                                            <p className=" mr-2 ml-2 transition-colors text-blue-300  w-fit break-all">{d.file.file_name}</p>
                                        </div>
                                        <button className="w-5 h-5 mr-2 ml-2" onClick={() => handleFileDownload(d.file.file_name, d.file.url, d.file.file_key)}><DownloadIcon /></button>
                                    </div>
                            }
                        </div>
                        {
                            d.file?.img &&
                            <Image file={d.file} sender={d.sender} index={d.index} sharechatRef={sharechatRef}/>
                        }
                    </div>
                ))
                }
                {
                    data[0] === undefined && <>
                        <Skeleton key={Math.random()} wrapper={true} wrapperStyle={{ width: "100%", height: "40px", marginBottom: "8px", position: "relative" }} style={{ width: "30%", height: "40px", marginTop: "8px", position: "absolute", right: "0px" }} count={1} />
                        <Skeleton key={Math.random()} wrapper={true} wrapperStyle={{ width: "100%", height: "40px", marginBottom: "8px", position: "relative" }} style={{ width: "50%", height: "40px", marginTop: "8px", position: "absolute", right: "0px" }} count={1} />
                        <Skeleton key={Math.random()} wrapper={true} wrapperStyle={{ width: "100%", height: "40px", marginBottom: "8px", position: "relative" }} style={{ width: "90%", height: "40px", marginTop: "8px", position: "absolute", right: "0px" }} count={1} />
                        <Skeleton key={Math.random()} wrapper={true} wrapperStyle={{ width: "100%", height: "40px", marginBottom: "8px", position: "relative" }} style={{ width: "30%", height: "40px", marginTop: "8px", position: "absolute", left: "0px" }} count={1} />
                        <Skeleton key={Math.random()} wrapper={true} wrapperStyle={{ width: "100%", height: "40px", marginBottom: "8px", position: "relative" }} style={{ width: "70%", height: "40px", marginTop: "8px", position: "absolute", left: "0px" }} count={1} />
                        <Skeleton key={Math.random()} wrapper={true} wrapperStyle={{ width: "100%", height: "40px", marginBottom: "8px", position: "relative" }} style={{ width: "50%", height: "40px", marginTop: "8px", position: "absolute", left: "0px" }} count={1} />
                        <Skeleton key={Math.random()} wrapper={true} wrapperStyle={{ width: "100%", height: "40px", marginBottom: "8px", position: "relative" }} style={{ width: "60%", height: "40px", marginTop: "8px", position: "absolute", right: "0px" }} count={1} />
                        <Skeleton key={Math.random()} wrapper={true} wrapperStyle={{ width: "100%", height: "40px", marginBottom: "8px", position: "relative" }} style={{ width: "50%", height: "40px", marginTop: "8px", position: "absolute", right: "0px" }} count={1} />
                        <Skeleton key={Math.random()} wrapper={true} wrapperStyle={{ width: "100%", height: "40px", marginBottom: "8px", position: "relative" }} style={{ width: "90%", height: "40px", marginTop: "8px", position: "absolute", right: "0px" }} count={1} />
                        <Skeleton key={Math.random()} wrapper={true} wrapperStyle={{ width: "100%", height: "40px", marginBottom: "8px", position: "relative" }} style={{ width: "30%", height: "40px", marginTop: "8px", position: "absolute", left: "0px" }} count={1} />
                        <Skeleton key={Math.random()} wrapper={true} wrapperStyle={{ width: "100%", height: "40px", marginBottom: "8px", position: "relative" }} style={{ width: "50%", height: "40px", marginTop: "8px", position: "absolute", left: "0px" }} count={1} />
                        <Skeleton key={Math.random()} wrapper={true} wrapperStyle={{ width: "100%", height: "40px", marginBottom: "8px", position: "relative" }} style={{ width: "90%", height: "40px", marginTop: "8px", position: "absolute", left: "0px" }} count={1} />
                        <Skeleton key={Math.random()} wrapper={true} wrapperStyle={{ width: "100%", height: "40px", marginBottom: "8px", position: "relative" }} style={{ width: "40%", height: "40px", marginTop: "8px", position: "absolute", left: "0px" }} count={1} />
                    </>
                }
            {
                (displayChosenImg && chosenImg?.name) &&
                <div className="w-2/3 max-h-96 bg-[color:var(--bg-secondary)] absolute bottom-14 left-3  flex flex-col justify-center p-2 rounded-lg">
                    <div className="w-full h-full overflow-auto mb-7">
                        <img className="object-contain w-full h-full" src={chosenImg?.src} />
                    </div>
                    <p className="w-full truncate absolute bottom-2">{chosenImg?.name}</p>
                    <button className="w-4 h-4 absolute -top-5 right-0" onClick={() => { setFile(null); setChosenImg({}); setDisplayChosenImg(false) }}><CloseIcon /></button>
                </div>
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
                        <input ref={inputRef} className="w-full bg-[color:var(--bg-secondary)] h-10 rounded-full outline-none pl-3 pr-20" placeholder="Message..." value={text} onChange={(e) => setText(e.target.value)} type={"text"} />
                        <div className="w-fit h-10 absolute right-0 flex">
                            {
                                !displayChosenFile &&
                                <div className="w-10 h-10">
                                    <input className="w-10 h-10 absolute opacity-0" type={"file"} accept="image/*" onChange={(e) => handleImageSelection(e)} />
                                    <button className="flex justify-center items-center w-10 h-10 absolute pointer-events-none"><div className="w-6 h-6"><CameraIcon /></div></button>
                                </div>
                            }
                            {
                                !displayChosenImg &&
                                <div className="w-10 h-10">
                                    <input className="w-10 h-10 absolute opacity-0" type={"file"} onChange={(e) => handleFileChange(e)} />
                                    <button className="flex justify-center items-center w-10 h-10 absolute pointer-events-none"><div className="w-6 h-6"><ClipIcon /></div></button>
                                </div>
                            }
                        </div>
                    </div>
                    <button className="flex justify-center items-center rounded-full w-10 h-10 bg-[color:var(--bg-secondary)] ml-2" type={"submit"}><SendIcon /></button>
                    {
                        alert && <div className="w-fit p-3 rounded-lg h-10 absolute left-2 -translate-y-12  bg-[color:var(--bg-secondary)] flex justify-center items-center"><p>{alertMessage}</p></div>
                    }
                </form>
            </div>
        </>
    )
}
