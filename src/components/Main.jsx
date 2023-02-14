import React, { useEffect, useState, useRef, useTransition } from "react";
import { auth, db, firestore } from "../auth/firebase";
import { storage } from "../auth/firebase";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { onValue, ref, set, push, limitToLast, query } from "firebase/database";
import { useAuth } from "../context/AuthContext";
import { nanoid } from "nanoid";
import ClipIcon from "../assets/ClipIcon";
import SendIcon from "../assets/SendIcon";
import DownloadIcon from "../assets/DownloadIcon";
import useFunction from "../hooks/useFunction";
import CloseIcon from "../assets/CloseIcon";
import BackIcon from "../assets/BackIcon";
import Skeleton from "./Skeleton";
import Message from "./sub_components/Message";
import CameraIcon from "../assets/CameraIcon";
import Compress from "compress.js";
import Image from "./sub_components/Image";
import Messages from "./sub_components/Messages";
import Input from "./sub_components/Input";
import ImageViewer from "./sub_components/ImageViewer";

export default function Main({ currentChat, setCurrentChat }) {
  const { currentUser } = useAuth();
  const sharechatRef = useRef(null);
  const inputRef = useRef(null);
  const [isPending, startTransition] = useTransition();
  const { handleDecrypt, handleDecryptText } = useFunction();
  const [data, setData] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [fileUploadStart, setFileUploadStart] = useState(false);
  const [fileUploadProgress, setFileUploadProgress] = useState(0);
  const [fileDownloadStart, setFileDownloadStart] = useState(false);
  const [fileDownloadProgress, setFileDownloadProgress] = useState(0);
  const [currentDownloadFileName, setCurrentDownloadFileName] = useState("");
  const [displayCopied, setDisplayCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("Sending...");
  const [displayChosenFile, setDisplayChosenFile] = useState(false);
  const [displayChosenImg, setDisplayChosenImg] = useState(false);
  const [chosenImg, setChosenImg] = useState({});
  const [imageViewerSrc, setImageViewerSrc] = useState("")
  //
  const handleBack = () => {
    startTransition(() => {
      setData([]);
      setFile(null);
      setFileUploadStart(false);
      setFileUploadProgress(0);
      setFileDownloadStart(false);
      setFileDownloadProgress(0);
      setCurrentDownloadFileName("");
      setDisplayCopied(false);
      setLoading(true);
      setDisplayChosenFile(false);
      setText("");
      setCurrentChat({});
      setAlert(false);
    });
  };
  //
  //
  const handleNew = async (data, keys, chat = []) => {
    await new Promise((resolve) => {
      const uid1 = !currentChat.sender ? currentUser.uid : currentChat.uid;
      const uid2 = currentChat.sender ? currentUser.uid : currentChat.uid;
      console.log(uid1, uid2);
      console.log(data);
      data.forEach(async (d, i) => {
        const key = handleDecrypt(d.text[currentUser.uid]);
        await handleDecryptText(d.text.text, key).then(
          async (decryptedText) => {
            // if (d.file !== undefined) {
            console.log(d);
            await handleDecryptText(d?.file?.file_name, key).then(
              (decryptedFileName) => {
                console.log(decryptedText, decryptedFileName);
                let object = {
                  text: decryptedText,
                  file: {
                    file_name: decryptedFileName,
                    file_key: d?.file?.[currentUser.uid],
                    url: d?.file?.url,
                    img: d?.file?.img,
                  },
                  index: keys[i],
                  sender: d?.sender === currentUser.uid ? true : false,
                };
                chat.push(object);
              }
            );
          }
        );
        if (data.length - 1 === i) {
          resolve(console.log("done"));
        }
      });
    });
    return chat;
  };
  //
  useEffect(() => {
    if (currentUser) {
      const uid1 = !currentChat.sender ? currentUser.uid : currentChat.uid;
      const uid2 = currentChat.sender ? currentUser.uid : currentChat.uid;
      if (localStorage.getItem(currentChat.uid) === null) {
        const q = ref(db, `chats/${uid1}/${uid2}`);
        return onValue(q, async (snapshot) => {
          if (snapshot.exists()) {
            let data = await handleNew(
              Object.values(snapshot.val()),
              Object.keys(snapshot.val())
            );
            console.log(data);
            startTransition(() => {
              setData(() => data);
            });
            localStorage.setItem(currentChat.uid, JSON.stringify(data));
          } else {
            console.log("no data");
          }
        });
      } else {
        let ls = JSON.parse(localStorage.getItem(currentChat.uid));
        startTransition(() => {
          setData(ls);
        });
        const q = query(ref(db, `chats/${uid1}/${uid2}`), limitToLast(1));
        return onValue(q, async (snapshot) => {
          ls = JSON.parse(localStorage.getItem(currentChat.uid));
          if (snapshot.exists()) {
            if (Object.keys(snapshot.val())[0] !== ls[ls.length - 1].index) {
              console.log(snapshot.val());
              let data = await handleNew(
                Object.values(snapshot.val()),
                Object.keys(snapshot.val()),
                ls
              );
              startTransition(() => {
                setData(data);
              });
              localStorage.setItem(currentChat.uid, JSON.stringify(data));
            }
          }
        });
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
    });
  }, []);
  //
  const renderI = (item, index) => {
    return <p>{item?.text}</p>;
  };
  return (
    <>
      <nav className="w-full h-10 bg-[color:var(--bg-secondary)] flex justify-center items-center relative">
        <button
          onClick={handleBack}
          className="w-10 h-10 md:hidden absolute left-2"
        >
          <div className="w-6 h-6">
            <BackIcon />
          </div>
        </button>
        <h1 className="w-full h-full flex justify-center items-center text-center">
          {currentChat.username}
        </h1>
        {currentChat.photoURL && (
          <div className="profile_img_container h-10 flex justify-center items-center absolute top-0 right-2">
            <button className="h-full w-8">
              <img className="rounded-full" src={currentChat.photoURL} />
            </button>
          </div>
        )}
      </nav>
      <div
        className="share_chat overflow-auto w-full h-[calc(100%_-_96px)] pt-2 pr-2 pl-2"
        ref={sharechatRef}
      >
        <Messages
          data={data}
          setDisplayCopied={setDisplayCopied}
          sharechatRef={sharechatRef}
          setAlert={setAlert}
          setAlertMessage={setAlertMessage}
          setCurrentDownloadFileName={setCurrentDownloadFileName}
          setFileDownloadProgress={setFileDownloadProgress}
          setFileDownloadStart={setFileDownloadStart}
          setImageViewerSrc={setImageViewerSrc}
        />
        {data[0] === undefined && (
          <Skeleton
            wrapper={true}
            wrapperStyle={{
              width: "100%",
              height: "40px",
              marginBottom: "8px",
              position: "relative",
            }}
            styleArray={[
              {
                width: "30%",
                height: "40px",
                marginTop: "8px",
                position: "absolute",
                right: "0px",
              },
              {
                width: "50%",
                height: "40px",
                marginTop: "8px",
                position: "absolute",
                right: "0px",
              },
              {
                width: "90%",
                height: "40px",
                marginTop: "8px",
                position: "absolute",
                right: "0px",
              },
              {
                width: "30%",
                height: "40px",
                marginTop: "8px",
                position: "absolute",
                left: "0px",
              },
              {
                width: "70%",
                height: "40px",
                marginTop: "8px",
                position: "absolute",
                left: "0px",
              },
              {
                width: "50%",
                height: "40px",
                marginTop: "8px",
                position: "absolute",
                left: "0px",
              },
              {
                width: "60%",
                height: "40px",
                marginTop: "8px",
                position: "absolute",
                right: "0px",
              },
              {
                width: "50%",
                height: "40px",
                marginTop: "8px",
                position: "absolute",
                right: "0px",
              },
              {
                width: "90%",
                height: "40px",
                marginTop: "8px",
                position: "absolute",
                right: "0px",
              },
              {
                width: "30%",
                height: "40px",
                marginTop: "8px",
                position: "absolute",
                left: "0px",
              },
              {
                width: "50%",
                height: "40px",
                marginTop: "8px",
                position: "absolute",
                left: "0px",
              },
              {
                width: "90%",
                height: "40px",
                marginTop: "8px",
                position: "absolute",
                left: "0px",
              },
              {
                width: "40%",
                height: "40px",
                marginTop: "8px",
                position: "absolute",
                left: "0px",
              },
            ]}
            count={13}
          />
        )}
      </div>
        {displayChosenImg && chosenImg?.name && (
          <div className="w-2/3 max-h-96 bg-[color:var(--bg-secondary)] absolute bottom-14 left-3  flex flex-col justify-center p-2 rounded-lg">
            <div className="w-full h-full overflow-auto mb-7">
              <img
                className="object-contain w-full h-full"
                src={chosenImg?.src}
              />
            </div>
            <p className="w-full truncate absolute bottom-2">
              {chosenImg?.name}
            </p>
            <button
              className="w-4 h-4 absolute -top-5 right-0"
              onClick={() => {
                setFile(null);
                setChosenImg({});
                setDisplayChosenImg(false);
              }}
            >
              <CloseIcon />
            </button>
          </div>
        )}
        {
            imageViewerSrc !=="" && <ImageViewer imgSrc={imageViewerSrc} setImageViewerSrc={setImageViewerSrc}/>
        }
      <div className="input_container w-full relative">
        {fileUploadStart && (
          <div className="w-1/2 h-20 bg-[color:var(--bg-secondary)] absolute top-0 right-3 -translate-y-20 flex flex-col p-2 rounded-lg">
            <div className="flex justify-center items-center">
              <div className="w-3 h-3">
                <ClipIcon size={2} />
              </div>
              <p className="truncate">{file?.name}</p>
            </div>
            <p className="w-full text-center">
              {Math.round(fileUploadProgress)}%
            </p>
            <div className="w-full h-3 bg-[color:var(--bg-primary)]  rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all"
                style={{ width: `${fileUploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
        {fileDownloadStart && (
          <div className="w-1/2 h-20 bg-[color:var(--bg-secondary)] absolute top-0 right-3 -translate-y-20 flex flex-col p-2 rounded-lg">
            <div className="flex justify-center items-center">
              <div className="w-3 h-3">
                <ClipIcon size={2} />
              </div>
              <p className="truncate">{currentDownloadFileName}</p>
            </div>
            <p className="w-full text-center">
              {Math.round(fileDownloadProgress)}%
            </p>
            <div className="w-full h-3 bg-[color:var(--bg-primary)]  rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all"
                style={{ width: `${fileDownloadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
        {displayChosenFile && (
          <div className="w-1/2 h-20 bg-[color:var(--bg-secondary)] absolute top-0 right-3 -translate-y-20 flex flex-col justify-center p-2 rounded-lg">
            <p className="w-full text-center">Selected File</p>
            <div className="flex justify-center items-center">
              <div className="w-3 h-3">
                <ClipIcon size={2} />
              </div>
              <p className="truncate">{file?.name}</p>
            </div>
            <button
              className="w-4 h-4 absolute top-3 right-3"
              onClick={() => {
                setFile(null);
                setDisplayChosenFile(false);
              }}
            >
              <CloseIcon />
            </button>
          </div>
        )}
        {displayCopied && (
          <div className="w-28 h-10 bg-[color:var(--bg-secondary)] absolute top-0 right-3 -translate-y-20 flex flex-col p-2 rounded-lg">
            <p className="w-full text-center">Copied!</p>
          </div>
        )}
        <Input
          alert={alert}
          alertMessage={alertMessage}
          displayChosenFile={displayChosenFile}
          displayChosenImg={displayChosenImg}
          inputRef={inputRef}
          file={file}
          setChosenImg={setChosenImg}
          setDisplayChosenFile={setDisplayChosenFile}
          setDisplayChosenImg={setDisplayChosenImg}
          setFile={setFile}
          setFileUploadStart={setFileUploadStart}
          setFileUploadProgress={setFileUploadProgress}
          setDisplayCopied={setDisplayCopied}
          currentChat={currentChat}
          setAlert={setAlert}
          setAlertMessage={setAlertMessage}
        />
      </div>
    </>
  );
}
