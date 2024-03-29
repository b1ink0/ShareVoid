import React, { useEffect, useState } from "react";
import { useStateContext } from "../context/StateContext";
import { useAuth } from "../context/AuthContext";
import NewUser from "./NewUser";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db, firestore } from "../auth/firebase";
import GoogleIcon from "../assets/GoogleIcon";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Profile from "./Profile";
import {
  limitToFirst,
  onValue,
  push,
  query,
  ref,
  get,
} from "firebase/database";
import { nanoid } from "nanoid";
import useFunction from "../hooks/useFunction";
import Main from "./Main";
import SearchUser from "./SearchUser";
import Skeleton from "./Skeleton";
import Chats from "./sub_components/Chats";
import { useMediaQuery } from "react-responsive";

export default function Home() {
  const { logIn, currentUser } = useAuth();
  const { loggedIn, setLoggedIn, username, setUsername } = useStateContext();
  const { handleEncryptText, handleEncrypt, handleDecryptWithKey } =
    useFunction();
  const [loading, setLoading] = useState(true);
  const [profileExists, setProfileExists] = useState(false);
  const [update, setUpdate] = useState(false);
  const [profile, setProfile] = useState(false);
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState({});
  const [searchUser, setSearchUser] = useState(false);
  const [keyExist, setKeyExist] = useState(true);
  const [incorrectPrivateKey, setIncorrectPrivateKey] = useState(false);
  const [privateKey, setPrivateKey] = useState("");
  const [checkPrivateKeyLoading, setCheckPrivateKeyLoading] = useState(false);
  const isDesktop = useMediaQuery({ minWidth: 768 });

  if (currentUser) {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoggedIn(true);
      } else {
        setLoggedIn(false);
      }
    });
  }
  //
  const handleSubmitPrivateKey = async (e) => {
    e.preventDefault();
    setCheckPrivateKeyLoading(true);
    setIncorrectPrivateKey(false);
    const q = query(
      ref(db, `chats/${currentUser.uid}/${currentUser.uid}`),
      limitToFirst(1)
    );
    get(q)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = Object.values(snapshot.val())[0].text;
          const decrypted = handleDecryptWithKey(
            data[currentUser.uid],
            privateKey
          );
          if (decrypted) {
            localStorage.setItem("privateKey", privateKey);
            setKeyExist(true);
            setProfileExists(true);
            setCheckPrivateKeyLoading(false);
            handleChats();
          } else {
            setIncorrectPrivateKey(true);
            setCheckPrivateKeyLoading(false);
          }
        } else {
          console.log("No data available");
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };
  //
  const handleGetUserInfo = async (chatUIDS, chatUIDS1, chats = []) => {
    await new Promise((resolve) => {
      if (chatUIDS.length !== 0) {
        chatUIDS.forEach(async (uid, i) => {
          console.log(uid);
          const docRef = doc(firestore, "users", uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            let chat = {
              uid: uid,
              username:
                currentUser.uid === uid ? "My Void" : docSnap.data().username,
              publicKey: docSnap.data().publicKey,
              sender: false,
              photoURL: docSnap.data().photoURL
                ? docSnap.data().photoURL
                : false,
            };
            if (chatUIDS.length - 1 === i) {
              console.log("hmm", chatUIDS1);
              if (chatUIDS1.length !== 0) {
                chatUIDS1.forEach(async (uid, i) => {
                  const docRef = doc(firestore, "users", uid);
                  const docSnap = await getDoc(docRef);
                  if (docSnap.exists()) {
                    let chat = {
                      uid: uid,
                      username:
                        currentUser.uid === uid
                          ? "My Void"
                          : docSnap.data().username,
                      publicKey: docSnap.data().publicKey,
                      sender: true,
                      photoURL: docSnap.data().photoURL
                        ? docSnap.data().photoURL
                        : false,
                    };
                    if (chatUIDS1.length - 1 === i) {
                      resolve(console.log("done"));
                    }
                    chats.push(chat);
                  } else {
                  }
                });
              } else {
                resolve(console.log("done"));
              }
            }
            chats.push(chat);
          } else {
          }
        });
      } else {
        if (chatUIDS1.length !== 0 && chatUIDS1[0] !== undefined) {
          chatUIDS1.forEach(async (uid, i) => {
            const docRef = doc(firestore, "users", uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              let chat = {
                uid: uid,
                username:
                  currentUser.uid === uid ? "My Void" : docSnap.data().username,
                publicKey: docSnap.data().publicKey,
                sender: true,
                photoURL: docSnap.data().photoURL
                  ? docSnap.data().photoURL
                  : false,
              };
              if (chatUIDS1.length - 1 === i) {
                resolve(console.log("done"));
              }
              chats.push(chat);
            } else {
            }
          });
        } else {
          resolve(console.log("done"));
        }
      }
    });
    return chats;
  };
  //
  const handleChats = () => {
    if (localStorage.getItem("chats") === null) {
      setLoading(true);
    } else {
      setChats(JSON.parse(localStorage.getItem("chats")));
      setLoading(false);
    }

    const q = ref(db, `chats/${currentUser.uid}`);
    return onValue(
      q,
      async (snapshot) => {
        if (snapshot.exists()) {
          const chatsUIDS = Object.keys(snapshot.val());
          const chatDoc = doc(firestore, "mychats", currentUser.uid);
          getDoc(chatDoc)
            .then(async (chatDocSnap) => {
              let uids = Object.keys(chatDocSnap.data());
              uids.splice(uids.indexOf(currentUser.uid), 1);
              uids.sort();
              const chats = await handleGetUserInfo(chatsUIDS, uids);
              handleLatestMessage(chats);
              // setChats(chats)
            //   localStorage.setItem("chats", JSON.stringify(chats));
              setLoading(false);
            })
            .catch((error) => {
              console.log(error);
            });
        } else {
          const key = nanoid();
          const encryptedText = await handleEncryptText(
            "Welcome To ShareVoid!",
            key
          );
          const message = {
            text: {
              text: encryptedText,
              [currentUser.uid]: handleEncrypt(key),
            },
            sender: currentUser.uid,
          };
          const q = ref(db, `chats/${currentUser.uid}/${currentUser.uid}`);
          push(q, message).then((request) => {
            setLoading(false);
            const mychats = doc(firestore, "mychats", currentUser.uid);
            const u = {
              [currentUser.uid]: {
                uid: currentUser.uid,
              },
            };
            setDoc(mychats, u).then(console.log("Documemt set"));
          });
        }
      },
      { onlyOnce: true }
    );
    // } else {
    //     let ls = JSON.parse(localStorage.getItem("chats"))
    //     setChats(ls)
    //     setLoading(false)
    //     const q = query(ref(db, `chats/${currentUser.uid}`), limitToLast(1), orderByKey());
    //     return onValue(q, async (snapshot) => {
    //         ls = JSON.parse(localStorage.getItem("chats"))
    //         let localUids = ls.map((chat) => chat.uid)
    //         if (snapshot.exists()) {
    //             const chatsUIDS = Object.keys(snapshot.val())
    //             const chatDoc = doc(firestore, "mychats", currentUser.uid);
    //             getDoc(chatDoc).then(async (chatDocSnap) => {
    //                 let uids = Object.keys(chatDocSnap.data())
    //                 uids.splice(uids.indexOf(currentUser.uid), 1)
    //                 uids.sort();
    //                 console.log("uids", chatsUIDS, localUids.includes(uids[uids.length - 1]))
    //                 if (localUids.includes(chatsUIDS[0]) && localUids.includes(uids[uids.length - 1])) {
    //                     console.log("Already up to date")
    //                     handleLatestMessage(ls)
    //                 } else if (localUids.includes(chatsUIDS[0]) && !localUids.includes(uids[uids.length - 1])) {
    //                     const chats = await handleGetUserInfo([], [uids[uids.length - 1]], ls);
    //                     console.log(chats)
    //                     handleLatestMessage(chats)
    //                     // setChats(chats)
    //                     localStorage.setItem("chats", JSON.stringify(chats))
    //                 } else if (!localUids.includes(chatsUIDS[0]) && localUids.includes(uids[uids.length - 1])) {
    //                     const chats = await handleGetUserInfo(chatsUIDS, [], ls);
    //                     console.log(chats)
    //                     handleLatestMessage(chats)
    //                     // setChats(chats)
    //                     localStorage.setItem("chats", JSON.stringify(chats))
    //                 } else if (!localUids.includes(chatsUIDS[0]) && !localUids.includes(uids[uids.length - 1])) {
    //                     const chats = await handleGetUserInfo(chatsUIDS, [uids[uids.length - 1]], ls);
    //                     console.log(chats)
    //                     handleLatestMessage(chats)
    //                     // setChats(chats)
    //                     localStorage.setItem("chats", JSON.stringify(chats))
    //                 } else {
    //                     console.log("Something went wrong")
    //                 }
    //             })
    //         } else {
    //             console.log("Something went wrong")
    //         }
    //     });
    // }
  };
  //
  const handleLatestMessage = (chats) => {
    let updatedChats = [];
    chats.map((chat) => {
      let messages = JSON.parse(localStorage.getItem(chat.uid));
      updatedChats.push({
        ...chat,
        latestMessage: messages ? messages[messages.length - 1] : false,
      });
    });
    localStorage.setItem("chats", JSON.stringify(updatedChats));
    setChats(updatedChats);
  };
  //
  useEffect(() => {
    if (currentUser) {
      if (loggedIn) {
        const docRef = doc(firestore, "users", currentUser.uid);
        const docSnap = getDoc(docRef);
        docSnap
          .then((doc) => {
            if (doc.exists()) {
              if (
                localStorage.getItem("publicKey") === null ||
                localStorage.getItem("privateKey") === null
              ) {
                setKeyExist(false);
                setLoading(false);
                localStorage.setItem("publicKey", doc.data().publicKey);
                localStorage.setItem("username", doc.data().username);
              } else {
                setProfileExists(true);
                handleChats();
                setUsername(doc.data()?.username);
                localStorage.setItem("username", doc.data().username);
              }
            } else {
              console.log("No such document!");
              setLoading(false);
            }
          })
          .catch((error) => {
            console.log("Error getting document:", error);
          });
      }
    } else {
      setLoading(false);
    }
  }, [loggedIn, update]);
  //
  useEffect(() => {
    try {
      if (chrome.runtime) {
        window.document.documentElement.style.setProperty("--width", "500px");
        window.document.documentElement.style.setProperty("--height", "500px");
      }
    } catch (e) {}
  }, []);
  //
  return (
    <section className="w-[var(--width)] h-[var(--height)] bg-[color:var(--bg-primary)] flex flex-col justify-start items-center relative overflow-hidden">
      {Object.keys(currentChat).length === 0 && (!isDesktop || !loggedIn) && (
        <nav className="w-full h-10 bg-[color:var(--bg-secondary)] flex justify-center items-center">
          <h1 className="w-full h-full flex justify-center items-center text-center">
            ShareVoid
          </h1>
          {currentUser && loggedIn && (
            <div className="profile_img_container h-10 flex justify-center items-center absolute top-0 right-2">
              <button className="h-full w-8" onClick={() => setProfile(true)}>
                <img className="rounded-full" src={currentUser.photoURL} />
              </button>
            </div>
          )}
        </nav>
      )}
      {profile && <Profile currentUser={currentUser} setProfile={setProfile} />}
      {searchUser && (
        <SearchUser
          setSearchUser={setSearchUser}
          setCurrentChat={setCurrentChat}
          myUsername={username}
        />
      )}
      {currentUser && loggedIn ? (
        loading ? (
          <div className="w-full h-[calc(100%_-_40px)] md:h-full  md:flex">
            <div className="chats_container w-full md:w-72 h-full md:h-full pb-3 overflow-auto flex flex-col  justify-start items-center relative">
              {isDesktop && (
                <nav className="w-full h-10 bg-[color:var(--bg-secondary)] flex justify-center items-center">
                  <h1 className="w-full h-full flex justify-center items-center text-center">
                    ShareVoid
                  </h1>
                  {currentUser && loggedIn && (
                    <div className="profile_img_container h-10 flex justify-center items-center absolute top-0 right-2">
                      <button
                        className="h-full w-8"
                        onClick={() => setProfile(true)}
                      >
                        <img
                          className="rounded-full"
                          src={currentUser.photoURL}
                        />
                      </button>
                    </div>
                  )}
                </nav>
              )}
              <div className="skeleton_div w-full h-full md:h-[calc(100%_-_40px)] overflow-auto px-2">
                <Skeleton
                  style={{ width: `100%`, height: "80px", marginTop: "12px" }}
                  count={9}
                />
              </div>
            </div>
            <div className="hidden md:flex flex-col justify-center items-center w-[calc(100%_-_288px)] h-full border-l-2 border-l-[color:var(--bg-secondary)] ">
              <p>Select a Chat</p>
              <p>＞﹏＜</p>{" "}
            </div>
          </div>
        ) : !keyExist ? (
          <form
            className="w-11/12 h-fit p-3 mt-7 border-4 border-[color:var(--bg-secondary)] rounded-lg"
            onSubmit={(e) => handleSubmitPrivateKey(e)}
          >
            <h1 className="text-center">Enter Your Private Key</h1>
            {incorrectPrivateKey && (
              <p className="w-full bg-[color:var(--bg-secondary)] p-3 rounded-lg text-center text-red-500 mt-3">
                Please Enter Correct Private Key!
              </p>
            )}
            <textarea
              onChange={(e) => {
                setPrivateKey(e.target.value);
                setIncorrectPrivateKey(false);
              }}
              className="w-full bg-[color:var(--bg-secondary)] h-36 rounded-lg outline-none my-3 p-3 pr-10 resize-none"
              type="text"
              placeholder="Enter Your Private Key..."
              required
            />
            {checkPrivateKeyLoading ? (
              <h1 className="w-full flex justify-center items-center text-center h-10 bg-[color:var(--bg-secondary)] rounded-lg p-2r">
                Checking Private Key...
              </h1>
            ) : (
              <button
                className="w-full h-10 bg-[color:var(--bg-secondary)] rounded-lg p-2"
                type="submit"
              >
                Submit
              </button>
            )}
          </form>
        ) : !profileExists ? (
          <NewUser setUpdate={setUpdate} />
        ) : Object.keys(currentChat).length === 0 ? (
          <Chats
            chats={chats}
            currentChat={currentChat}
            setCurrentChat={setCurrentChat}
            setSearchUser={setSearchUser}
            currentUser={currentUser}
            loggedIn={loggedIn}
            setProfile={setProfile}
            isDesktop={isDesktop}
          />
        ) : (
          <div className="h-full w-full relative">
            {isDesktop ? (
              <Chats
                chats={chats}
                currentChat={currentChat}
                setCurrentChat={setCurrentChat}
                setSearchUser={setSearchUser}
                currentUser={currentUser}
                loggedIn={loggedIn}
                setProfile={setProfile}
                isDesktop={isDesktop}
              />
            ) : (
              <Main currentChat={currentChat} setCurrentChat={setCurrentChat} />
            )}
          </div>
        )
      ) : (
        <div className="absolute w-full h-full flex justify-center items-center">
          <button
            onClick={logIn}
            className="bg-[color:var(--bg-secondary)] pt-1 pb-1 pr-4 pl-4 flex justify-center items-center rounded-full"
          >
            <span>Log In Using</span>
            <div className="w-4 ml-2">
              <GoogleIcon size={4} />
            </div>
          </button>
        </div>
      )}
    </section>
  );
}
