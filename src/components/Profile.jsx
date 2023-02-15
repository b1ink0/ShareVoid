import React from "react";
import CloseIcon from "../assets/CloseIcon";
import { useAuth } from "../context/AuthContext";
import "../styles/profile.scss";
import { useStateContext } from "../context/StateContext";

export default function Profile({ currentUser, setProfile }) {
  const { username } = useStateContext();
  const { logOut } = useAuth();
  return (
    <div className="slideIn absolute top-0 right-0 flex flex-col justify-center items-center border-4 border-[color:var(--bg-primary)] bg-[color:var(--bg-secondary)] rounded-bl-xl h-fit w-36 z-10 p-2">
      <button
        className="w-5 h-5 absolute top-2 right-2"
        onClick={() => setProfile(false)}
      >
        <CloseIcon size={"full"} />
      </button>
      <img className="w-10 h-10 rounded-full mb-2" src={currentUser.photoURL} />
      <p className="w-full truncate text-center mb-2">
        {username ? username : currentUser.displayName}
      </p>
      <button
        className="w-full mb-2 pt-0 pb-1 pr-2 pl-2 rounded-full bg-red-500"
        onClick={() => logOut()}
      >
        LogOut
      </button>
    </div>
  );
}
