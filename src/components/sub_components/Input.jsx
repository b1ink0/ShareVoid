import React, { useState } from "react";
import CameraIcon from "../../assets/CameraIcon";
import ClipIcon from "../../assets/ClipIcon";
import SendIcon from "../../assets/SendIcon";
import Compress from "compress.js";
import { nanoid } from "nanoid";
import useFunction from "../../hooks/useFunction";
import { useAuth } from "../../context/AuthContext";
import { db, storage } from "../../auth/firebase";
import { push, ref } from "firebase/database";
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytesResumable,
} from "firebase/storage";

export default function Input({
  inputRef,
  displayChosenFile,
  displayChosenImg,
  alert,
  alertMessage,
  setChosenImg,
  file,
  setFile,
  setDisplayChosenImg,
  setDisplayChosenFile,
  setAlert,
  setAlertMessage,
  setFileUploadStart,
  setFileUploadProgress,
  currentChat,
}) {
  const {
    handleEncryptFile,
    handleEncrypt,
    handleEncryptWithKey,
    handleDecrypt,
    handleEncryptText,
    handleDecryptText,
  } = useFunction();
  const { currentUser } = useAuth();
  const [text, setText] = useState("");
  //
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inputRef.current !== null) {
      inputRef.current.focus();
    }
    const uid1 = !currentChat.sender ? currentUser.uid : currentChat.uid;
    const uid2 = currentChat.sender ? currentUser.uid : currentChat.uid;
    console.log(uid1, uid2);
    console.log(text, file);
    if (file === null && text !== "") {
      setAlert(true);
      setAlertMessage("Encrypting...");
      const key = nanoid();
      const encryptedText = await handleEncryptText(text, key);
      setAlertMessage("Sending...");
      const message = {
        text: {
          text: encryptedText,
          [currentUser.uid]: handleEncrypt(key),
          [currentChat.uid]: handleEncryptWithKey(key, currentChat.publicKey),
        },
        sender: currentUser.uid,
        timestamp: Date.now(),
      };
      console.log(message);
      push(ref(db, `chats/${uid1}/${uid2}`), message)
        .then((d) => {
          console.log(d);
          setText("");
          setAlert(false);
        })
        .catch((e) => {
          console.log(e);
          setAlert(false);
        });
    } else if (file !== null) {
      setAlert(true);
      setChosenImg({});
      setAlertMessage("Encrypting...");
      const key = nanoid();
      handleEncryptFile(file, key)
        .then((encryptedFile) => {
          setAlertMessage("Uploading...");
          const storageReff = storageRef(
            storage,
            `${uid1}/${uid2}/${nanoid()}`
          );
          const uploadTask = uploadBytesResumable(storageReff, encryptedFile);
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              setDisplayChosenFile(false);
              setFileUploadStart(true);
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setFileUploadProgress(progress);
              console.log("Upload is " + progress + "% done");
              switch (snapshot.state) {
                case "paused":
                  console.log("Upload is paused");
                  break;
                case "running":
                  console.log("Upload is running");
                  break;
              }
            },
            (error) => {},
            () => {
              getDownloadURL(uploadTask.snapshot.ref).then(
                async (downloadURL) => {
                  setAlertMessage("Sending...");
                  const encryptedText =
                    text !== "" ? await handleEncryptText(text, key) : "";
                  const message = {
                    text: {
                      text: encryptedText,
                      [currentUser.uid]: handleEncrypt(key),
                      [currentChat.uid]: handleEncryptWithKey(
                        key,
                        currentChat.publicKey
                      ),
                    },
                    file: {
                      file_name: await handleEncryptText(file.name, key),
                      [currentUser.uid]: handleEncrypt(key),
                      [currentChat.uid]: handleEncryptWithKey(
                        key,
                        currentChat.publicKey
                      ),
                      url: downloadURL,
                      img: displayChosenImg,
                    },
                    sender: currentUser.uid,
                    timestamp: Date.now(),
                  };
                  push(ref(db, `chats/${uid1}/${uid2}`), message)
                    .then((d) => {
                      console.log(d);
                      setText("");
                      setFile(null);
                      setDisplayChosenImg(false);
                      setChosenImg({});
                      setFileUploadProgress(0);
                      setFileUploadStart(false);
                      setAlert(false);
                    })
                    .catch((e) => {
                      console.log(e);
                      setDisplayChosenImg(false);
                      setChosenImg({});
                      setFileUploadProgress(0);
                      setFileUploadStart(false);
                      setAlert(false);
                    });
                }
              );
            }
          );
        })
        .catch((e) => {
          setEncrypting(false);
        });
    } else {
      setAlertMessage("Please enter some text or choose a file!");
      setAlert(true);
      const timer = setTimeout(() => {
        setAlert(false);
        clearTimeout(timer);
      }, 1000);
    }
  };
  //
  const handleImageSelection = (e) => {
    if (e.target.files[0].size > 5000000) {
      alert("File size should be less than 5MB!");
    } else {
      const compress = new Compress();
      compress
        .compress([...e.target.files], {
          size: 4,
          quality: 0.75,
          maxWidth: 1920,
          maxHeight: 1920,
          resize: true,
          rotate: false,
        })
        .then(async (data) => {
          const img1 = data[0];
          const base64str = img1.data;
          const imgExt = img1.ext;
          const file = Compress.convertBase64ToFile(base64str, imgExt);
          file.name = img1.alt;
          let object = {
            name: nanoid(),
            src: img1.prefix + img1.data,
          };
          setChosenImg(object);
          setFile(file);
          setDisplayChosenImg(true);
        });
    }
  };
  //
  const handleFileChange = (e) => {
    if (e.target.files[0].size > 5000000) {
      alert("File size should be less than 5MB!");
    } else {
      setFile(e.target.files[0]);
      setDisplayChosenFile(true);
    }
  };
  //
  return (
    <form
      onSubmit={(e) => handleSubmit(e)}
      className="w-full flex justify-center items-center relative p-2"
    >
      <div className="w-full h-10 relative flex justify-center items-center overflow-hidden rounded-full">
        <input
          ref={inputRef}
          className="w-full bg-[color:var(--bg-secondary)] h-10 rounded-full outline-none pl-3 pr-20"
          placeholder="Message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          type={"text"}
        />
        <div className="w-fit h-10 absolute right-0 flex">
          {!displayChosenFile && (
            <div className="w-10 h-10">
              <input
                className="w-10 h-10 absolute opacity-0"
                type={"file"}
                accept="image/*"
                onChange={(e) => handleImageSelection(e)}
              />
              <button className="flex justify-center items-center w-10 h-10 absolute pointer-events-none">
                <div className="w-6 h-6">
                  <CameraIcon />
                </div>
              </button>
            </div>
          )}
          {!displayChosenImg && (
            <div className="w-10 h-10">
              <input
                className="w-10 h-10 absolute opacity-0"
                type={"file"}
                onChange={(e) => handleFileChange(e)}
              />
              <button className="flex justify-center items-center w-10 h-10 absolute pointer-events-none">
                <div className="w-6 h-6">
                  <ClipIcon />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
      <button
        className="flex justify-center items-center rounded-full w-10 h-10 bg-[color:var(--bg-secondary)] ml-2"
        type={"submit"}
      >
        <SendIcon />
      </button>
      {alert && (
        <div className="w-fit p-3 rounded-lg h-10 absolute left-2 -translate-y-12  bg-[color:var(--bg-secondary)] flex justify-center items-center">
          <p>{alertMessage}</p>
        </div>
      )}
    </form>
  );
}
