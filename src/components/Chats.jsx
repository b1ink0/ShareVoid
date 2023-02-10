import React from 'react'
import CloseIcon from '../assets/CloseIcon'
import ClipIcon from '../assets/ClipIcon'
import { nanoid } from 'nanoid'
import Main from './Main'

export default function Chats({ chats, setSearchUser, setCurrentChat, md, isDesktop, currentChat, currentUser, loggedIn, setProfile }) {
    return (
        <div style={{ display: md ? "none" : "flex" }} className="w-full h-full hidden md:flex">
            <button onClick={() => setSearchUser(true)} className="md:hidden w-14 h-14 flex justify-center items-center bg-[color:var(--bg-secondary)] absolute bottom-3 right-3 rounded-full">
                <div className="w-7 h-7 rotate-45"><CloseIcon /></div>
            </button>
            <div className="chats_container w-full md:relative md:w-96 h-[calc(100%_-_40px)] md:h-full overflow-auto flex flex-col justify-start items-center">
                <button onClick={() => setSearchUser(true)} className="hidden md:flex w-14 h-14 justify-center items-center bg-[color:var(--bg-secondary)] absolute bottom-3 right-3 rounded-full">
                    <div className="w-7 h-7 rotate-45"><CloseIcon /></div>
                </button>
                {isDesktop &&
                    <nav className="w-full h-10 bg-[color:var(--bg-secondary)] flex justify-center items-center">
                        <h1 className="w-full h-full flex justify-center items-center text-center">
                            ShareVoid
                        </h1>
                        {
                            currentUser && loggedIn &&
                            <div className="profile_img_container h-10 flex justify-center items-center absolute top-0 right-2">
                                <button className="h-full w-8" onClick={() => setProfile(true)}>
                                    <img className="rounded-full" src={currentUser.photoURL} />
                                </button>
                            </div>
                        }
                    </nav>
                }
                {
                    chats && chats.map((chat, i) => (
                        <div onClick={() => setCurrentChat(chat)} key={nanoid()} className="chat_container w-[calc(100%_-_15px)] mt-3 p-2 rounded-lg h-20  bg-[color:var(--bg-secondary)] flex justify-start items-center ">
                            <div className="profile_img_container h-14  w-14  flex justify-center items-center bg-gray-900 rounded-full overflow-hidden">
                                {chat.photoURL ? <img src={chat.photoURL} /> : ":)"}
                            </div>
                            <div className="chat_container flex flex-col justify-center items-start ml-3">
                                <h3>{chat.username}</h3>
                                {chat.latestMessage ?
                                    !chat.latestMessage.text && chat.latestMessage.file.file_name ?
                                        <div className="w-40 flex justify-center items-center">
                                            <div className="w-3 h-3"><ClipIcon size={2} /></div>
                                            <p className="truncate w-full text-third">{chat.latestMessage?.file?.file_name}</p>
                                        </div> :
                                        chat.latestMessage.text && chat.latestMessage.file.file_name ?
                                            <div className="w-40 flex flex-col">
                                                <p className="truncate w-full text-third">{chat.latestMessage.text}</p>
                                                <div className="flex justify-center items-center">
                                                    <div className="w-3 h-3"><ClipIcon size={2} /></div>
                                                    <p className="truncate w-full text-third">{chat.latestMessage?.file?.file_name}</p>
                                                </div>
                                            </div> :
                                            <p className="truncate w-40 text-third">{chat.latestMessage.text}</p> :
                                    <p className="text-third">No Messages Yet!</p>}
                            </div>
                        </div>
                    ))
                }
            </div>

            {
                Object.keys(currentChat).length === 0 &&
                <div className="hidden md:flex flex-col justify-center items-center w-full h-full border-l-2 border-l-[color:var(--bg-secondary)] "><p>Select a Chat</p><p>＞﹏＜</p> </div>
            }
            {
                currentChat && Object.keys(currentChat).length !== 0 && isDesktop &&
                <div className="w-full h-full flex flex-col border-l-2 border-l-[color:var(--bg-secondary)]">
                    <Main key={Math.random()} currentChat={currentChat} setCurrentChat={setCurrentChat} />
                </div>
            }
        </div>
    )
}
