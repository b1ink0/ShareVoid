import React, { useEffect, useState } from 'react'
import { db } from '../auth/firebase'
import { storage } from '../auth/firebase'
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import { onValue, ref, set, push } from 'firebase/database'
import { useAuth } from '../context/AuthContext'
import { nanoid } from 'nanoid'

export default function Main() {
    const [data, setData] = useState([])
    const [text, setText] = useState("")
    const [file, setFile] = useState(null)
    const { currentUser } = useAuth()
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
    useEffect(() => {
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
    }, []);
    //
    useEffect(() => {
        console.log(data)
    }, [data])
    //
    return (
        <section>
            <div className="share_chat">
                {data.map((d, i) => (
                    <div key={i}>
                        <div className="chat">
                        <p>{d.text}</p>
                        {d.file && <button onClick={() => handleFileDownload(d.file.path)}>{d.file.file_name}</button>}
                        </div>
                    </div>
                ))
                }
            </div>
            <div className="input_container">
                <form onSubmit={(e) => handleSubmit(e)}>
                    <input value={text} onChange={(e) => setText(e.target.value)} type={"text"} />
                    <input type={"file"} onChange={(e) => handleFileChange(e)} />
                    <button type={"submit"}>Send</button>
                </form>
            </div>
        </section>
    )
}
