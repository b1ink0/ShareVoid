import React from "react";
import CloseIcon from "../../assets/CloseIcon";
import DownloadIcon from "../../assets/DownloadIcon";
import Compress from "compress.js";

export default function ImageViewer({ imgSrc, setImageViewerSrc }) {
    const handleDownloadImage = () => {
        const file = Compress.convertBase64ToFile(imgSrc.split(",")[1]);
        const a = document.createElement("a");
        a.href = URL.createObjectURL(file);
        a.download = "image.png";
        a.click();
        a.remove()
    }
  return (
    <div className="fadeIn absolute top-0 right-0 w-full h-full flex justify-center items-center bg-[color:var(--bg-primary-semi-transparent)] z-20">
      <div className="w-auto mx-3 max-h-[80%] border-8 border-[color:var(--bg-secondary)] rounded-lg relative overflow-auto">
        <button
          className="w-4 h-4 fixed top-3 right-3"
          onClick={() => setImageViewerSrc("")}
        >
          <CloseIcon />
        </button>
        <button
          className="w-4 h-4 fixed top-3 right-20"
          onClick={() => handleDownloadImage()}
        >
          <DownloadIcon />
        </button>
        <img className="object-contain w-auto h-auto" src={imgSrc} />
      </div>
    </div>
  );
}
