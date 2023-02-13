import React, { useState } from 'react'
import CopyIcon from '../../assets/CopyIcon';

export default function Message({ text, setDisplayCopied     }) {
    const [isReadMore, setIsReadMore] = useState(true);
    //
    const handleToggleReadMore = () => {
        setIsReadMore(!isReadMore);
    }
    //
    const handleCopy = (e) => {
        setDisplayCopied(true)
        setTimeout(() => {
            setDisplayCopied(false)
        }, 1000)
        var input = document.createElement("input");
        input.setAttribute("value", e);
        document.body.appendChild(input);
        input.select();
        var result = document.execCommand("copy");
        document.body.removeChild(input);
        return result;
    };
    //
    const handleText = (text) => {
        const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
        const renderText = (t) =>
            t
                .split(" ")
                .map(part =>
                    URL_REGEX.test(part) ?
                        <div className="">
                            <a className="transition-colors text-blue-300 hover:text-blue-500 hover:underline" href={part} target="_blank" rel="noopener noreferrer">{part}</a>
                            <span className="w-3 h-3 ml-2 cursor-pointer inline-block" onClick={() => handleCopy(part)}>
                                <CopyIcon size={3} />
                            </span>
                        </div> : part + " "
                );
        return renderText(text)
    }
    return (
        <div className="mr-2 ml-2 break-all text-justify">
            {isReadMore ?
                <>
                    {
                        handleText(text.slice(0, 150))
                    }
                    {
                        text.length >= 200 &&
                        <span onClick={handleToggleReadMore} className="text-blue-300">
                            {isReadMore ? "...read more" : " show less"}
                        </span>
                    }
                </>
                :
                <>
                    {
                        handleText(text)
                    }
                    {
                        text.length >= 200 &&
                        <span onClick={handleToggleReadMore} className="text-blue-300">
                            {isReadMore ? "...read more" : " show less"}
                        </span>
                    }
                </>
            }
        </div>
    )
}
