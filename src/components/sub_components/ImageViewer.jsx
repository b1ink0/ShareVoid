import React from "react";
import CloseIcon from "../../assets/CloseIcon";

export default function ImageViewer({ imgSrc, setImageViewerSrc }) {
  return (
    <div className="fadeIn absolute top-0 right-0 w-full h-full flex justify-center items-center bg-[color:var(--bg-primary-semi-transparent)] z-20">
      <div className="w-auto mx-3 max-h-[80%] border-8 border-[color:var(--bg-secondary)] rounded-lg relative overflow-auto">
        <button
          className="w-4 h-4 fixed top-3 right-3"
          onClick={() => setImageViewerSrc("")}
        >
          <CloseIcon />
        </button>
        <img className="object-contain w-auto h-auto" src={imgSrc} />
      </div>
    </div>
  );
}
