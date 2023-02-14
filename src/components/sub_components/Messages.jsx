import React, { useEffect, useState, useTransition } from "react";
import Message from "./Message";
import DownloadIcon from "../../assets/DownloadIcon";
import { nanoid } from "nanoid";
import Image from "./Image";
import useFunction from "../../hooks/useFunction";

export default function Messages({
  data,
  setDisplayCopied,
  sharechatRef,
  setAlert,
  setAlertMessage,
  setFileDownloadStart,
  setCurrentDownloadFileName,
  setFileDownloadProgress,
  setImageViewerSrc
}) {
  const { handleDecryptFile, handleDecrypt } = useFunction();
  const [currentData, setCurrentData] = useState([]);
  const [isPending, startTransition] = useTransition();
  const objectsEqual = (o1, o2) =>
    Object.keys(o1).length === Object.keys(o2).length &&
    Object.keys(o1).every((p) => o1[p] === o2[p]);

  console.log(objectsEqual(data, currentData));
  //
  useEffect(() => {
    if (data && data.length > 0) {
      if (!objectsEqual(data, currentData)) {
        console.log("data changed");
        startTransition(() => {
          setCurrentData(data);
        });
      }
    }
  }, [data]);
  //f
  const handleFileDownload = (name, url, key) => {
    setAlert(true);
    setAlertMessage("Downloading...");
    setFileDownloadStart(true);
    setCurrentDownloadFileName(name);
    console.log(name, url);
    const xhr = new XMLHttpRequest();
    xhr.responseType = "blob";
    xhr.onprogress = (event) => {
      setFileDownloadProgress((event.loaded / event.total) * 100);
    };
    xhr.onload = (event) => {
      const blob = xhr.response;
      const responseFile = new File([blob], name);
      setAlertMessage("Decrypting...");
      handleDecryptFile(responseFile, handleDecrypt(key)).then(
        (decryptedFile) => {
          setAlertMessage("Done");
          setAlert(false);
          console.log(decryptedFile, handleDecrypt(key));
          const responseBlob = new Blob([decryptedFile]);
          const a = document.createElement("a");
          a.href = window.URL.createObjectURL(responseBlob);
          a.download = name;
          a.click();
          a.remove();
          setFileDownloadProgress(0);
          setFileDownloadStart(false);
        }
      );
    };
    xhr.open("GET", url);
    xhr.send();
  };
  return (
    <>
      {currentData &&
        currentData.map((d, i) => (
          <div
            key={nanoid()}
            className={`w-full flex  ${
              d.sender ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={` file_text_container w-fit rounded-lg ${
                !d.sender ? "bg-[color:var(--bg-secondary)]" : "bg-gray-700"
              } mb-2 pb-2 pt-2 overflow-hidden`}
            >
              {(d.text && !d.file?.img) && (
                <Message setDisplayCopied={setDisplayCopied} text={d.text} />
              )}
              {d.file?.img
                ? ""
                : d.file.file_name && (
                    <div className="max-w-full flex flex-wrap justify-start items-center">
                      <div className="max-w-full">
                        <p className=" mr-2 ml-2 transition-colors text-blue-300  w-fit break-all">
                          {d.file.file_name}
                        </p>
                      </div>
                      <button
                        className="w-5 h-5 mr-2 ml-2"
                        onClick={() =>
                          handleFileDownload(
                            d.file.file_name,
                            d.file.url,
                            d.file.file_key
                          )
                        }
                      >
                        <DownloadIcon />
                      </button>
                    </div>
                  )}
            </div>
            {d.file?.img && (
              <Image
                text={d.text}
                file={d.file}
                sender={d.sender}
                index={d.index}
                sharechatRef={sharechatRef}
                setDisplayCopied={setDisplayCopied}
                setImageViewerSrc={setImageViewerSrc}
              />
            )}
          </div>
        ))}
    </>
  );
}
