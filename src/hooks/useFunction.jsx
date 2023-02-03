import { JSEncryptRSAKey } from 'jsencrypt/lib/JSEncryptRSAKey';
import { JSEncrypt } from 'jsencrypt/lib/JSEncrypt';

export default function useFunction() {
    //
    const handleLocalKeys = () => {
        const publicKey = localStorage.getItem("publicKey")
        const privateKey = localStorage.getItem("privateKey")
        return { publicKey, privateKey }
    }
    //
    const handleEncrypt = (text) => {
        const encrypt = new JSEncrypt();
        encrypt.setPublicKey(handleLocalKeys().publicKey);
        return encrypt.encrypt(text);
    }  
    //
    const handleEncryptWithKey = (text, key) => {
        const encrypt = new JSEncrypt();
        encrypt.setPublicKey(key);
        return encrypt.encrypt(text);
    }  
    //
    const handleDecrypt = (text) => {
        const decrypt = new JSEncrypt();
        decrypt.setPrivateKey(handleLocalKeys().privateKey);
        return decrypt.decrypt(text);
    }
    //
    const handleDecryptWithKey = (text, key) => {
        const decrypt = new JSEncrypt();
        decrypt.setPrivateKey(key);
        return decrypt.decrypt(text);
    }
    //
    const handleGenerateKey = () => {
        const key = new JSEncryptRSAKey();
        key.generate(2048, '10001');
        return { publicKey: key.getPublicKey(), privateKey: key.getPrivateKey() };
    }
    //
    const handleReadFile = (file) => {
        return new Promise((resolve, reject) => {
            var fr = new FileReader();
            fr.onload = () => {
                resolve(fr.result)
            };
            fr.readAsArrayBuffer(file);
        });
    }
    //
    const handleEncryptText = async (text, key) => {
        const blob = new Blob([text]);
        const encryptedFile = await handleEncryptFile(blob, key)
        if (encryptedFile) {
            let encryptedText = await handleReadFile(encryptedFile)
            encryptedText = new Uint32Array(encryptedText)
            encryptedText = [...encryptedText]
            encryptedText = JSON.stringify(encryptedText)
            return encryptedText
        }
    }
    //
    const handleDecryptText = async (text, key) => {
        let encryptedText = JSON.parse(text)
        encryptedText = new Uint32Array(encryptedText)
        const blob = new Blob([encryptedText]);
        const decryptedFile = await handleDecryptFile(blob, key)
        if (decryptedFile) {
            return await decryptedFile.text()
        }
    }
    //
    const handleEncryptFile = async (file, key) => {
        var plaintextbytes = await handleReadFile(file)
            .catch(function (err) {
                console.error(err);
            });
        var plaintextbytes = new Uint8Array(plaintextbytes);

        var pbkdf2iterations = 10000;
        var passphrasebytes = new TextEncoder("utf-8").encode(key);
        var pbkdf2salt = window.crypto.getRandomValues(new Uint8Array(8));

        var passphrasekey = await window.crypto.subtle.importKey('raw', passphrasebytes, { name: 'PBKDF2' }, false, ['deriveBits'])
            .catch(function (err) {
                console.error(err);
            });
        console.log('passphrasekey imported');

        var pbkdf2bytes = await window.crypto.subtle.deriveBits({ "name": 'PBKDF2', "salt": pbkdf2salt, "iterations": pbkdf2iterations, "hash": 'SHA-256' }, passphrasekey, 384)
            .catch(function (err) {
                console.error(err);
            });
        console.log('pbkdf2bytes derived');
        pbkdf2bytes = new Uint8Array(pbkdf2bytes);

        let keybytes = pbkdf2bytes.slice(0, 32);
        let ivbytes = pbkdf2bytes.slice(32);

        var key = await window.crypto.subtle.importKey('raw', keybytes, { name: 'AES-CBC', length: 256 }, false, ['encrypt'])
            .catch(function (err) {
                console.error(err);
            });
        console.log('key imported');

        var cipherbytes = await window.crypto.subtle.encrypt({ name: "AES-CBC", iv: ivbytes }, key, plaintextbytes)
            .catch(function (err) {
                console.error(err);
            });

        if (!cipherbytes) {
            spnEncstatus.classList.add("redspan");
            spnEncstatus.innerHTML = '<p>Error encrypting file.  See console log.</p>';
            return;
        }

        console.log('plaintext encrypted');
        cipherbytes = new Uint8Array(cipherbytes);

        var resultbytes = new Uint8Array(cipherbytes.length + 16)
        resultbytes.set(new TextEncoder("utf-8").encode('Salted__'));
        resultbytes.set(pbkdf2salt, 8);
        resultbytes.set(cipherbytes, 16);

        var blob = new Blob([resultbytes]);
        let output = new File([blob], file.name + ".enc")
        return output;
    }
    //
    const handleDecryptFile = async (file, key) => {
        var cipherbytes = await handleReadFile(file)
            .catch(function (err) {
                console.error("filereaderror",err);
            });
            console.log(cipherbytes)
            var cipherbytes = new Uint8Array(cipherbytes);
            var pbkdf2iterations = 10000;
            var passphrasebytes = new TextEncoder("utf-8").encode(key);
        var pbkdf2salt = cipherbytes.slice(8, 16);

        var passphrasekey = await window.crypto.subtle.importKey('raw', passphrasebytes, { name: 'PBKDF2' }, false, ['deriveBits'])
            .catch(function (err) {
                console.error(err);

            });
        console.log('passphrasekey imported');

        var pbkdf2bytes = await window.crypto.subtle.deriveBits({ "name": 'PBKDF2', "salt": pbkdf2salt, "iterations": pbkdf2iterations, "hash": 'SHA-256' }, passphrasekey, 384)
            .catch(function (err) {
                console.error(err);
            });
        console.log('pbkdf2bytes derived');
        pbkdf2bytes = new Uint8Array(pbkdf2bytes);

        let keybytes = pbkdf2bytes.slice(0, 32);
        let ivbytes = pbkdf2bytes.slice(32);
        cipherbytes = cipherbytes.slice(16);

        var key = await window.crypto.subtle.importKey('raw', keybytes, { name: 'AES-CBC', length: 256 }, false, ['decrypt'])
            .catch(function (err) {
                console.error(err);
            });
        console.log('key imported');

        var plaintextbytes = await window.crypto.subtle.decrypt({ name: "AES-CBC", iv: ivbytes }, key, cipherbytes)
            .catch(function (err) {
                console.error(err);
            });

        if (!plaintextbytes) {
            return;
        }

        console.log('ciphertext decrypted');
        plaintextbytes = new Uint8Array(plaintextbytes);

        var blob = new Blob([plaintextbytes]);
        let output = new File([blob], 'file')
        return output;
    }
    //
    const handleCopy = (e, setDisplayCopied) => {
        setDisplayCopied(true);
        setTimeout(() => {
            setDisplayCopied(false);
        }, 1000);
        var input = document.createElement("input");
        input.setAttribute("value", e);
        document.body.appendChild(input);
        input.select();
        var result = document.execCommand("copy");
        document.body.removeChild(input);
        return result;
    };
    //
    //
    const handleDownloadJSON = (object, name) => {
        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(object));
        var a = document.createElement('a');
        a.setAttribute("href", dataStr);
        a.setAttribute("download", name + ".json");
        document.body.appendChild(a); // required for firefox
        a.click();
        a.remove();
    }

    return { handleEncryptFile, handleDecryptFile, handleGenerateKey, handleEncrypt, handleEncryptWithKey, handleDecrypt, handleDecryptWithKey, handleCopy, handleDownloadJSON, handleEncryptText, handleDecryptText, handleLocalKeys }
}
