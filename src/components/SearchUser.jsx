import React, { useEffect, useState } from 'react'
import { db, firestore } from '../auth/firebase';
import { collection, doc, endAt, getDocs, orderBy, query, setDoc, startAt, updateDoc, where } from 'firebase/firestore';
import { async } from '@firebase/util';
import CloseIcon from '../assets/CloseIcon';
import { useAuth } from '../context/AuthContext';
import { get, push, ref } from 'firebase/database';
import { nanoid } from 'nanoid';
import useFunction from '../hooks/useFunction';

export default function SearchUser() {
  const { handleEncrypt, handleEncryptWithKey, handleEncryptText } = useFunction();
  const { currentUser } = useAuth();
  const [username, setUsername] = useState("")
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [noResult, setNoResult] = useState(false)
  const [areYouSure, setAreYouSure] = useState(false)
  const [selectedUser, setSelectedUser] = useState({})
  //
  const handleNewChat = async () => {
    console.log(selectedUser)
    const q = ref(db, `chats/${currentUser.uid}/${selectedUser.uid}`);
    get(q).then((snapshot) => {
      if (snapshot.exists())
        console.log("exists 1")
      else {
        const q = ref(db, `chats/${selectedUser.uid}/${currentUser.uid}`)
        get(q).then(async (snapshot) => {
          if (snapshot.exists())
            console.log("exists 2")
          else {
            const key = nanoid()
            const encryptedText = await handleEncryptText(selectedUser.username + " has started a chat with you!", key);
            const message = {
              text: {
                text: encryptedText,
                [currentUser.uid]: handleEncrypt(key),
                [selectedUser.uid]: handleEncryptWithKey(key, selectedUser.publicKey)
              }
            }
            const q = ref(db, `chats/${selectedUser.uid}/${currentUser.uid}`);
            push(q, message).then((request) => {
              console.log("sent")
              const mychats = doc(firestore, "mychats", currentUser.uid);
              const chat = {
                [selectedUser.uid]: {
                  uid: selectedUser.uid,
                }
              }
              updateDoc(mychats, chat).then(() => {
                console.log("updated")
              }).catch((error) => {
                console.log(error)
              })
            })
          }
        })
      }
    })
  }
  //
  const getUser = async (username) => {
    setSearching(true)
    const publicUserRef = query(collection(firestore, "users"), orderBy("username"), startAt(username), endAt(username + "\uf8ff"))
    getDocs(publicUserRef).then((result) => {
      console.log(result.docs)
      if (result.size === 0) {
        setSearching(false)
        setResults([])
        setNoResult(true)
        return;
      }
      let users = []
      let i = 0
      result.forEach((doc) => {
        console.log(doc.data(), result.size, i)
        users.push(doc.data())
        if (result.size - 1 === i) {
          console.log(users)
          setSearching(false)
          setResults(users)
        }
        i++
      })
    }).catch((error) => {
      console.log(error)
    })
  }
  //
  useEffect(() => {
    setResults([])
    setNoResult(false)
    if (username === "") return;
    console.log(username)
    getUser(username)
  }, [username])
  //
  return (
    <div className="absolute w-full h-full flex justify-center items-center bg-[color:var(--bg-primary-semi-transparent)] z-20">
      <div className="w-10/12 h-2/3 p-3 bg-[color:var(--bg-secondary)] rounded-lg relative">
        <div className="input_container w-full h-10 mb-3 relative flex justify-center items-center overflow-hidden rounded-full">
          <input value={username} maxLength={15} onChange={(e) => setUsername(e.target.value)} className="w-full bg-[color:var(--bg-primary)] h-10 rounded-full outline-none pl-4 pr-4" placeholder="Enter Username..." type="text" />
          <p className="absolute right-2 text-[color:var(--text-secondary)]">{username.length}/15</p>
        </div>
        <div className="search_results_container h-[calc(100%_-_52px)] overflow-auto bg-[color:var(--bg-primary)] rounded-lg p-3">
          {
            (!searching && results[0] === undefined && noResult) ? <p className="text-center">No Result</p> :
              (!searching && results[0] === undefined) ? <p className="text-center">Enter Username</p> :
                (searching && results[0] === undefined) ? <p className="text-center">Searching...</p>
                  :
                  results[0] && results.map((result, i) => (
                    <div key={i} className="fadeIn search_result w-full h-12 flex justify-start pr-2 pl-2 items-center bg-[color:var(--bg-secondary)] rounded-lg mb-3 relative">
                      <div className="profile_img_container h-9 w-9 mr-3 flex justify-center items-center bg-gray-900 rounded-full">
                      </div>
                      <h3>{result.username}</h3>
                      {
                        result.uid !== currentUser.uid &&
                        <button onClick={() => { setAreYouSure(true); setSelectedUser(result) }} className="absolute right-4 w-9 h-9 rounded-full flex justify-center items-center"><div className="w-4 h-4 rotate-45"><CloseIcon /></div></button>
                      }
                    </div>
                  ))
          }
        </div>
        {
          areYouSure &&
          <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center bg-[color:var(--bg-primary-semi-transparent)] ">
            <div className="w-4/5 h-fit p-3 border-4 border-[color:var(--bg-secondary)] rounded-lg flex flex-col justify-center items-center">
              <p className="text-center">
                Start a chat with {selectedUser.username}?
              </p>
              <div className="button_container flex justify-center items-center mt-2">
                <button onClick={() => { setAreYouSure(false); setSelectedUser({}) }} className="w-28 h-9 bg-[color:var(--bg-secondary)] text-[color:var(--text-primary)] rounded-lg mr-3">Cancel</button>
                <button onClick={() => handleNewChat()} className="w-28 h-9 bg-[color:var(--bg-secondary)] text-[color:var(--text-primary)] rounded-lg">Start Chat</button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  )
}
