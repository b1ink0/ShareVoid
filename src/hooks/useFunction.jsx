import { JSEncryptRSAKey } from "jsencrypt/lib/JSEncryptRSAKey";
import { JSEncrypt } from "jsencrypt/lib/JSEncrypt";
import { AES, enc } from "crypto-js";
import { Buffer } from "buffer";

export default function useFunction() {
  //
  const handleLocalKeys = () => {
    const publicKey = localStorage.getItem("publicKey");
    const privateKey = localStorage.getItem("privateKey");
    return { publicKey, privateKey };
  };
  //
  const handleEncrypt = (text) => {
    const encrypt = new JSEncrypt();
    encrypt.setPublicKey(handleLocalKeys().publicKey);
    return encrypt.encrypt(text);
  };
  //
  const handleEncryptWithKey = (text, key) => {
    const encrypt = new JSEncrypt();
    encrypt.setPublicKey(key);
    return encrypt.encrypt(text);
  };
  //
  const handleDecrypt = (text) => {
    const decrypt = new JSEncrypt();
    decrypt.setPrivateKey(handleLocalKeys().privateKey);
    return decrypt.decrypt(text);
  };
  //
  const handleDecryptWithKey = (text, key) => {
    const decrypt = new JSEncrypt();
    decrypt.setPrivateKey(key);
    return decrypt.decrypt(text);
  };
  //
  const handleGenerateKey = async () => {
    let key;
    await new Promise((resolve) => {
      key = new JSEncryptRSAKey();
      key.generate(2048, "10001");
      resolve(console.log("Key generated!"));
    });
    return { publicKey: key.getPublicKey(), privateKey: key.getPrivateKey() };
  };
  //
  const handleReadFile = (file) => {
    return new Promise((resolve, reject) => {
      var fr = new FileReader();
      fr.onload = () => {
        resolve(fr.result);
      };
      fr.readAsArrayBuffer(file);
    });
  };
  //
  const handleFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      var fr = new FileReader();
      fr.onload = () => {
        resolve(fr.result);
      };
      fr.readAsDataURL(file);
    });
  };
  //
  const handleEncryptText = async (text, key) => {
    return AES.encrypt(JSON.stringify(text), key).toString();
  };
  //
  const handleDecryptText = async (text, key) => {
    try {
      return JSON.parse(AES.decrypt(text, key).toString(enc.Utf8));
    } catch (error) {
      return false;
    }
  };
  //
  const handleEncryptFile = async (file, key) => {
    let f = await handleFileToBase64(file);
    console.log(f.slice(0, 100));
    f = AES.encrypt(f, key).toString();
    f = new File([f], file.name + ".enc");
    return f;
  };
  //
  const handleDecryptFile = async (file, key) => {
    let f = await file.text();
    f = AES.decrypt(f, key).toString(enc.Utf8);
    f = await fetch(f);
    f = await f.blob();
    f = new File([f], "text.png");
    return f;
  };
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
  const handleDownloadJSON = (key, name) => {
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(key);
    var a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("download", name + ".txt");
    document.body.appendChild(a); // required for firefox
    a.click();
    a.remove();
  };

  return {
    handleEncryptFile,
    handleDecryptFile,
    handleGenerateKey,
    handleEncrypt,
    handleEncryptWithKey,
    handleDecrypt,
    handleDecryptWithKey,
    handleCopy,
    handleDownloadJSON,
    handleEncryptText,
    handleDecryptText,
    handleLocalKeys,
  };
}
