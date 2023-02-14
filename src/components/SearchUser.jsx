import React, { useEffect, useState, useTransition } from "react";
import { db, firestore } from "../auth/firebase";
import {
  collection,
  doc,
  endAt,
  getDocs,
  orderBy,
  query,
  setDoc,
  startAt,
  updateDoc,
  where,
} from "firebase/firestore";
import { async } from "@firebase/util";
import CloseIcon from "../assets/CloseIcon";
import { useAuth } from "../context/AuthContext";
import { get, push, ref } from "firebase/database";
import { nanoid } from "nanoid";
import useFunction from "../hooks/useFunction";
import Skeleton from "./Skeleton";
import TickIcon from "../assets/TickIcon";

export default function SearchUser({ setSearchUser, setCurrentChat }) {
  const { handleEncrypt, handleEncryptWithKey, handleEncryptText } =
    useFunction();
  const [isPending, startTransition] = useTransition();
  const [isPendingSelectedUser, startTransitionSelectedUser] = useTransition();
  const { currentUser } = useAuth();
  const [username, setUsername] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [noResult, setNoResult] = useState(false);
  const [areYouSure, setAreYouSure] = useState(false);
  const [selectedUser, setSelectedUser] = useState({});
  const [alert, setAlert] = useState(false);
  //
  const handleNewChat = async () => {
    console.log(selectedUser);
    const q = ref(db, `chats/${currentUser.uid}/${selectedUser.uid}`);
    get(q).then((snapshot) => {
      if (snapshot.exists()) console.log("exists 1");
      else {
        const q = ref(db, `chats/${selectedUser.uid}/${currentUser.uid}`);
        get(q).then(async (snapshot) => {
          if (snapshot.exists()) console.log("exists 2");
          else {
            const key = nanoid();
            const encryptedText = await handleEncryptText(
              selectedUser.username + " has started a chat with you!",
              key
            );
            const message = {
              text: {
                text: encryptedText,
                [currentUser.uid]: handleEncrypt(key),
                [selectedUser.uid]: handleEncryptWithKey(
                  key,
                  selectedUser.publicKey
                ),
              },
              sender: currentUser.uid,
            };
            const q = ref(db, `chats/${selectedUser.uid}/${currentUser.uid}`);
            push(q, message).then((request) => {
              console.log("sent");
              const mychats = doc(firestore, "mychats", currentUser.uid);
              const chat = {
                [selectedUser.uid]: {
                  uid: selectedUser.uid,
                },
              };
              updateDoc(mychats, chat)
                .then(() => {
                  console.log("updated");
                  startTransition(() => {
                    setAreYouSure(false);
                    setUsername("");
                    setCurrentChat({
                      uid: selectedUser.uid,
                      username: selectedUser.username,
                      publicKey: selectedUser.publicKey,
                      sender: true,
                    });
                    setSearchUser(false);
                  });
                })
                .catch((error) => {
                  console.log(error);
                });
            });
          }
        });
      }
    });
  };
  //
  const getUser = async (username) => {
    setSearching(true);
    const publicUserRef = query(
      collection(firestore, "users"),
      orderBy("username"),
      startAt(username),
      endAt(username + "\uf8ff")
    );
    getDocs(publicUserRef)
      .then((result) => {
        console.log(result.docs);
        if (result.size === 0) {
          setSearching(false);
          setResults([]);
          setNoResult(true);
          return;
        }
        let users = [];
        let i = 0;
        let ls = JSON.parse(localStorage.getItem("chats"));
        let localUids = ls.map((chat) => chat.uid);
        result.forEach((doc) => {
          console.log(
            doc.data(),
            result.size,
            localUids.includes(doc.data().uid)
          );
          users.push({
            ...doc.data(),
            isLocal: localUids.includes(doc.data().uid),
          });
          if (result.size - 1 === i) {
            console.log(users);
            setSearching(false);
            setResults(users);
          }
          i++;
        });
      })
      .catch((error) => {
        console.log(error);
      });
  };
  //
  const handleSelectUser = (user) => {
    console.log(user);
    startTransitionSelectedUser(() => {
      setSelectedUser(user);
    });
  };
  //
  useEffect(() => {
    setResults([]);
    setNoResult(false);
    if (username === "") return;
    console.log(username);
    getUser(username.toLowerCase());
  }, [username]);
  //
  useEffect(() => {
    console.log(isPendingSelectedUser);
    if (!isPendingSelectedUser && selectedUser.uid) {
      console.log(selectedUser);
      startTransition(() => {
        setAreYouSure(false);
        setUsername("");
        setCurrentChat({
          uid: selectedUser.uid,
          username: selectedUser.username,
          publicKey: selectedUser.publicKey,
          sender: true,
        });
        setSearchUser(false);
      });
    }
  }, [isPendingSelectedUser]);
  //
  return (
    <div className="fadeIn absolute w-full h-full flex justify-center items-center bg-[color:var(--bg-primary-semi-transparent)] z-20">
      <div className="w-10/12 h-2/3 p-3 bg-[color:var(--bg-secondary)] rounded-lg relative">
        <button
          className="w-5 h-5 absolute -top-8 -right-0"
          onClick={() => setSearchUser(false)}
        >
          <CloseIcon size={"full"} />
        </button>
        <div className="input_container w-full h-10 mb-3 relative flex justify-center items-center overflow-hidden rounded-full">
          <input
            value={username}
            maxLength={15}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-[color:var(--bg-primary)] h-10 rounded-full outline-none pl-4 pr-4"
            placeholder="Enter Username..."
            type="text"
          />
          <p className="absolute right-2 text-[color:var(--text-secondary)]">
            {username.length}/15
          </p>
        </div>
        <div className="search_results_container h-[calc(100%_-_52px)] overflow-auto bg-[color:var(--bg-primary)] rounded-lg p-3">
          {!searching && results[0] === undefined && noResult ? (
            <p className="text-center h-40 flex justify-center items-center">
              User not found! <br /> ＞﹏＜
            </p>
          ) : !searching && results[0] === undefined ? (
            <p className="text-center">Enter Username</p>
          ) : searching && results[0] === undefined ? (
            <Skeleton
              count={7}
              style={{ width: "100%", height: "48px", marginBottom: "12px" }}
            />
          ) : (
            results[0] &&
            results.map((result, i) => (
              <div
                key={i}
                className="fadeIn search_result w-full h-12 flex justify-start pr-2 pl-2 items-center bg-[color:var(--bg-secondary)] rounded-lg mb-3 relative"
              >
                <div className="profile_img_container h-9 w-9 mr-3 flex justify-center items-center bg-gray-900 rounded-full"></div>
                <h3>{result.username}</h3>
                {result.uid !== currentUser.uid && !result.isLocal ? (
                  <button
                    onClick={() => {
                      setAreYouSure(true);
                      setSelectedUser(result);
                    }}
                    className="absolute right-4 w-9 h-9 rounded-full flex justify-center items-center"
                  >
                    <div className="w-4 h-4 rotate-45">
                      <CloseIcon />
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={() => handleSelectUser(result)}
                    className="absolute right-4 w-9 h-9 rounded-full flex justify-center items-center"
                  >
                    <div className="w-4 h-4">
                      <TickIcon />
                    </div>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
        {areYouSure && (
          <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center bg-[color:var(--bg-primary-semi-transparent)] ">
            <div className="w-full h-fit md:w-72 p-3 border-4 border-[color:var(--bg-secondary)] rounded-lg flex flex-col justify-center items-center">
              <p className="text-center">
                Start a chat with {selectedUser.username}?
              </p>
              <div className="button_container flex justify-center items-center mt-2">
                <button
                  onClick={() => {
                    setAreYouSure(false);
                    setSelectedUser({});
                  }}
                  className="w-28 h-9 bg-[color:var(--bg-secondary)] text-[color:var(--text-primary)] rounded-lg mr-3"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleNewChat()}
                  className="w-28 h-9 bg-[color:var(--bg-secondary)] text-[color:var(--text-primary)] rounded-lg"
                >
                  Start Chat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
