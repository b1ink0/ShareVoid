import React, { memo, useEffect, useState } from "react";
import useFunction from "../../hooks/useFunction";
import { useIndexedDB } from "react-indexed-db";
import Message from "./Message";
import { useStateContext } from "../../context/StateContext";
function Image({
  text,
  file,
  index,
  sender,
  sharechatRef,
  setDisplayCopied,
  setImageViewerSrc,
  imgSrc
}) {
  const { handleDecryptFile, handleDecrypt } = useFunction();
  const [src, setSrc] = useState("");
  const [fileDownloadProgress, setFileDownloadProgress] = useState(0);
  const { add, getByIndex } = useIndexedDB("localImages");
  useEffect(() => {
    getByIndex("image", index)
      .then((d) => {
        if (d === undefined) {
          const xhr = new XMLHttpRequest();
          xhr.responseType = "blob";
          xhr.onprogress = (event) => {
            setFileDownloadProgress((event.loaded / event.total) * 100);
          };
          xhr.onload = (event) => {
            const blob = xhr.response;
            const responseFile = new File([blob], file.file_name);
            handleDecryptFile(responseFile, handleDecrypt(file.file_key)).then(
              (decryptedFile) => {
                const fr = new FileReader();
                fr.onload = (e) => {
                  add({ index: index, data: e.target.result })
                    .then((d) => {})
                    .catch((e) => console.log(e));
                  setSrc(e.target.result);
                  if (sharechatRef.current !== null) {
                    sharechatRef.current.scrollTop =
                      sharechatRef.current.scrollHeight;
                  }
                };
                fr.readAsDataURL(decryptedFile);
              }
            );
          };
          xhr.open("GET", file.url);
          xhr.send();
        } else {
          setSrc(d.data);
          if (sharechatRef.current !== null) {
            sharechatRef.current.scrollTop = sharechatRef.current.scrollHeight;
          }
        }
      })
      .catch((e) => {
        console.log(e);
      });
  }, []);
  return (
    <div
      className={`${
        src === "" ? "w-[60%]" : "max-w-[60%]"
      } max-h-[400px] flex flex-col justify-end p-2 mb-2 rounded-lg items-end ${
        !sender ? "bg-[color:var(--bg-secondary)]" : "bg-gray-700"
      }`}
    >
      {text && <Message text={text} setDisplayCopied={setDisplayCopied} />}
      {src !== "" ? (
        <div className="w-full h-full overflow-auto">
          <img
            onClick={() => setImageViewerSrc(src)}
            className="object-contain w-auto h-auto"
            src={src}
          />
        </div>
      ) : (
        <div className="w-full flex justify-center items-center">
          {text && <p className="text-white">{text}</p>}
          <p className="w-11 mr-2 text-center">
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
    </div>
  );
}

export default memo(Image);
