import React, { useEffect, useState } from 'react'
import { auth, db } from '../auth/firebase'
import { storage } from '../auth/firebase'
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import { onValue, ref, set, push } from 'firebase/database'
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

export default function Main() {
    const [data, setData] = useState([])
    const [text, setText] = useState("")
    const { logIn } = useAuth()
    const [file, setFile] = useState(null)
    const [profile, setProfile] = useState(false)
    const { currentUser } = useAuth()
    const { loggedIn, setLoggedIn } = useStateContext()
    //
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
    const handleSubmit = (e) => {
        e.preventDefault()
        console.log(text, file)
        if (file === null && text !== "") {
            push(ref(db, `data/${currentUser.uid}/sharechat`,),
                {
                    text: text,
                }

            ).then((d) => {
                console.log(d);
                setText("")
            }).catch((e) => {
                console.log(e)
            })
        } else if (file !== null) {
            const storageReff = storageRef(storage, `${currentUser.uid}/${nanoid()}`);
            uploadBytes(storageReff, file).then((snapshot) => {
                console.log(snapshot)
                push(ref(db, `data/${currentUser.uid}/sharechat`,),
                    {
                        text: text,
                        file: {
                            file_name: file.name,
                            path: snapshot.metadata.fullPath
                        },
                    }
                ).then((d) => {
                    console.log(d);
                    setText("")
                    setFile(null)
                }).catch((e) => {
                    console.log(e)
                })
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
        }
    }
    //
    const handleFileDownload = (path) => {
        const storageReff = storageRef(storage, path);
        getDownloadURL(storageReff).then((url) => {
            const xhr = new XMLHttpRequest();
            xhr.responseType = 'blob';
            xhr.onprogress = (event) => {
                console.log(event.loaded / event.total)
            };
            xhr.onload = (event) => {
                const blob = xhr.response;

                const a = document.createElement('a');
                a.href = window.URL.createObjectURL(blob);
                a.download = path.split("/")[1];
                a.click();
            };
            xhr.open('GET', url);
            xhr.send();
        }).catch((error) => {
            console.log(error)
        });
    }
    //
    const handleCopy = (e) => {
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
    useEffect(() => {
        if (currentUser) {
            const query = ref(db, `data/${currentUser.uid}`);
            return onValue(query, (snapshot) => {
                const data = snapshot.val();

                if (snapshot.exists()) {
                    Object.values(data.sharechat).map((d) => {
                        // console.log(d)
                        setData((ds) => [...ds, d]);
                    });
                }
            });
        }
    }, [currentUser]);
    //
    return (
        <section className="w-96 h-96 bg-[color:var(--bg-primary)] flex flex-col justify-center items-center relative overflow-hidden">
            {
                currentUser && loggedIn ?
                    <>
                        {
                            profile && <Profile currentUser={currentUser} setProfile={setProfile} />
                        }
                        <nav className="w-full h-7 relative bg-[color:var(--bg-secondary)]">
                            <h1 className="w-full h-7 text-center">
                                ShareVoid
                            </h1>
                            <div className="profile_img_container h-7 flex justify-center items-center absolute top-0 right-2">
                                <button className="h-full w-5" onClick={() => setProfile(true)}>
                                    <img className="w-5  rounded-full" src={currentUser.photoURL} />
                                </button>
                            </div>
                        </nav>
                        <div className="share_chat overflow-auto w-full h-[304px] pt-2 pr-2 pl-2">
                            {data.map((d) => (
                                <div key={nanoid()} className="file_text_container w-fit rounded-lg bg-[color:var(--bg-secondary)] mb-2 pb-2 pt-2 overflow-hidden">
                                    {
                                        d.text !== "" && <p className="mr-2 ml-2 break-all">{handleText(d.text)}</p>
                                    }
                                    {
                                        d.file &&
                                        <div className="flex bg-[color:var(--bg-secondary)] justify-start items-center">
                                            <div className="flex">
                                                <p className=" mr-2 ml-2 transition-colors text-blue-300">{d.file.file_name}</p>
                                            </div>
                                            <button className="w-5 h-5 mr-2 ml-2" onClick={() => handleFileDownload(d.file.path)}><DownloadIcon /></button>
                                        </div>
                                    }
                                </div>
                            ))
                            }
                        </div>
                        <div className="input_container w-full">
                            <form onSubmit={(e) => handleSubmit(e)} className="w-full flex relative p-2">
                                <div className="w-80 h-10 relative flex justify-center items-center overflow-hidden rounded-full">
                                    <input className="w-full bg-[color:var(--bg-secondary)] h-10 rounded-full outline-none pl-3 pr-10" placeholder="Enter..." value={text} onChange={(e) => setText(e.target.value)} type={"text"} />
                                    <div className="w-10 h-10 file_button_container absolute right-0">
                                        <input className="w-10 h-10 absolute opacity-0" type={"file"} onChange={(e) => handleFileChange(e)} />
                                        <button className="flex justify-center items-center w-10 h-10 absolute pointer-events-none"><ClipIcon size={6} /></button>
                                    </div>
                                </div>
                                <button className="flex justify-center items-center rounded-full w-10 h-10 bg-[color:var(--bg-secondary)] ml-2" type={"submit"}><SendIcon /></button>
                            </form>
                        </div>
                    </>
                    : <>
                        <nav className="w-full h-7 bg-[color:var(--bg-secondary)] absolute top-0">
                            <h1 className="w-full h-7 text-center">
                                ShareVoid
                            </h1>
                        </nav>
                        <button onClick={logIn} className="bg-[color:var(--bg-secondary)] pt-1 pb-1 pr-4 pl-4 flex justify-center items-center rounded-full">
                            <span>Log In Using</span>
                            <div className="w-4 ml-2">
                                <GoogleIcon size={4} />
                            </div>
                        </button>
                    </>
            }
        </section>
    )
}
