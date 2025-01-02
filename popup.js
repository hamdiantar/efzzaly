if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received in popup.js:", message);
    if (message.action === "textSelected") {
      const inputBox = document.getElementById("speechToText");
      inputBox.value = message.text;
    }
  });
} else {
  console.warn("chrome.runtime.onMessage is not available.");
}

let videoSource = [];
let currentVideoIndex = 0;

const micButton = document.getElementById("micButton");
micButton.addEventListener("click", () => {
  const recognition = new webkitSpeechRecognition();
  recognition.lang = 'ar-SA';
  recognition.onresult = (event) => {
    document.getElementById("speechToText").value = event.results[0][0].transcript;
  };
  recognition.start();
});


// const processButton = document.getElementById("processButton");
// processButton.addEventListener("click", async () => {
//   const text = document.getElementById("speechToText").value.trim();
//   document.getElementById("speechToText").innerText = text;
//   try {
//     const words = text.split(/\s+/);
//     videoSource = [];
//     currentVideoIndex = 0;
//     const wordList = document.getElementById("wordList");
//     wordList.innerHTML = "";
//     for (const [index, word] of words.entries()) {
//       const videoLink = `https://sshi.sa/api/file/${word}.mp4`;
//       const isPlayable = await isVideoPlayable(videoLink);
//       if (!isPlayable) {
//         console.warn(`Video not found or invalid for word: ${word}`);
//         continue;
//       }
//       const listItem = document.createElement("li");
//       listItem.id = `word-${index}`;
//       listItem.innerText = word;
//       listItem.style.cursor = "pointer";
//       listItem.addEventListener("click", () => {
//         highlightWord(index);
//         const videoPlayer = document.getElementById("videoPlayer");
//         videoPlayer.src = videoLink;
//         videoPlayer.onloadeddata = () => {
//           videoPlayer.play().catch((error) => console.error("Playback failed:", error));
//         };
//       });
//       wordList.appendChild(listItem);
//       videoSource.push(videoLink);
//     };
//   } catch (error) {
//     console.error("Error:", error);
//   }
// });


// -----------------------------------------------

const processButton = document.getElementById("processButton");
processButton.addEventListener("click", async () => {
  const text = document.getElementById("speechToText").value.trim();
  const stopWords = ["و", "في", "على", "من", "إلى", "أن", "ال", "عن", "ما", "هو", "هي"];

  try {
    const wordList = document.getElementById("wordList");
    wordList.innerHTML = "";
    videoSource = [];
    currentVideoIndex = 0;
    if (!isNaN(text)) {
      const numberVideoLink = await searchForLetter(text);
      if (numberVideoLink) {
        addVideoToList(numberVideoLink, text, 0);
        return;
      }
    }
    // 1. Check for full text
    let videoLink = `https://sshi.sa/api/file/${text}.mp4`;
    if (await isVideoPlayable(videoLink)) {
      addVideoToList(videoLink, text, 0);
      return;
    }

    // 2. Split into words excluding stop words
    const words = text.split(/\s+/).filter(word => !stopWords.includes(word));
    for (const [index, word] of words.entries()) {
      videoLink = `https://sshi.sa/api/file/${word}.mp4`;
      if (await isVideoPlayable(videoLink)) {
        addVideoToList(videoLink, word, index);
      } else {
        // 3. Split word into letters
        for (const [index2, letter] of [...word].entries()) {
          videoLink = await searchForLetter(letter);
          if (videoLink) {
            addVideoToList(videoLink, letter, `${index}-${index2}`);
          } else {
            console.warn(`No video found for letter: ${letter}`);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error during processing:", error);
  }
});


// -----------------------------------------------


const playPauseButton = document.getElementById("playPauseButton");
playPauseButton.addEventListener("click", () => {
  const videoPlayer = document.getElementById("videoPlayer");
  if (videoPlayer.paused) {
    playVideo();
  } else {
    videoPlayer.pause();
  }
});

function playVideo() {
  const videoPlayer = document.getElementById("videoPlayer");

  if (currentVideoIndex < videoSource.length) {
    // Set video source
    videoPlayer.src = videoSource[currentVideoIndex];
    
    // Highlight the word
    highlightWord(currentVideoIndex);

    // Play the video
    videoPlayer.onloadeddata = () => {
      videoPlayer.play().catch(error => console.error("Playback failed:", error));
    };

    // Handle video end
    videoPlayer.onended = () => {
      removeHighlight(currentVideoIndex);
      currentVideoIndex++;
      playVideo();
    };
  } else {
    currentVideoIndex = 0; // Reset the index if all videos are played
  }
}

function highlightWord(index) {
  const listItem = document.getElementById(`word-${index}`);
  if (listItem) {
    listItem.style.cursor = "pointer";
    listItem.style.color = "#ffffff";
    listItem.style.fontSize = "15px";
    listItem.style.backgroundColor = "#24c8ad";
  } else {
    console.error(`Highlight failed: Word with index ${index} not found.`);
  }
}

function removeHighlight(index) {
  const listItem = document.getElementById(`word-${index}`);
  if (listItem) {
    listItem.style.cursor = "";
    listItem.style.color = "";
    listItem.style.fontSize = "";
    listItem.style.backgroundColor = "";
  } else {
    console.error(`Remove highlight failed: Word with index ${index} not found.`);
  }
}


document.addEventListener("DOMContentLoaded", () => {
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get("selectedText", (result) => {
      if (result.selectedText) {
        const inputBox = document.getElementById("speechToText");
        inputBox.value = result.selectedText;
        chrome.storage.local.remove("selectedText");
      }
    });
  } else {
    console.warn("chrome.storage.local is not available.");
  }
});



async function isVideoPlayable(url) {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.src = url;
    video.style.display = "none";
    video.preload = "auto";
    video.onloadeddata = () => {
      resolve(true);
      video.remove();
    };
    video.onerror = () => {
      resolve(false);
      video.remove();
    };
    document.body.appendChild(video);
  });
}


async function searchForLetter(letter) {
  const letterMap = {
    "ء" : "https://sshi.sa/api/file/BhZRb48akdJjHz3COdWoJ8QR42EjuQ6T.mp4",
    "أ": "https://sshi.sa/api/file/497BAAFqGHLefyawkNFgoQQ1YvfXNg3C.mp4",
    "ا" : "https://sshi.sa/api/file/XhtQuLi1DSQCv1mrJv3fIDiZXw7V6y1L.mp4",
    "إ": "https://sshi.sa/api/file/Bv3o9hSBQrVC7MhQRugw4azlNaialRW1.mp4",
    "ب": "https://sshi.sa/api/file/HIfOZ2iW8muaXDhZO9X00PLaLu7wihwz.mp4",
    "آ": "https://sshi.sa/api/file/iJD5E66lnXg5r6ei7mCnKULKMsAwN9ad.mp4",
    "ال": "https://sshi.sa/api/file/4H7LsrX1Xct94je16Go6LiWoRVWcyJg3.mp4",
    "ة": "https://sshi.sa/api/file/TwF4M2YCdFoHqDeJoU4LA0cRCL7n1yFc.mp4",
    "ت": "https://sshi.sa/api/file/QsRPbnlp9TIV4CRmlIsOgbW6iM3nTu6U.mp4",
    "ث": "https://sshi.sa/api/file/apfrwzaCEpmJSJNt5mIQxd07hDB1TUc5.mp4",
    "ج": "https://sshi.sa/api/file/ssoQZhTcbYf5yA7Np2BZjAoxAXGqSG6V.mp4",
    "ح": "https://sshi.sa/api/file/r1ldzQI9G4RyINqxnpG0pLf4Ay8TKGk8.mp4",
    "خ": "https://sshi.sa/api/file/DHzooWiPIuCzdejNGAVv3YcmvuAkyhpC.mp4",
    "د": "https://sshi.sa/api/file/LYyJXd4fYyQRXcjXOic7DEj83kmoJSGf.mp4",
    "ذ": "https://sshi.sa/api/file/GtAwRQto56WLo16jNLS9PI5HQ3xtKKzY.mp4",
    "ر": "https://sshi.sa/api/file/hlLZt5RUPnyE3g0InPpwP6rSh4elnyQa.mp4",
    "ز": "https://sshi.sa/api/file/vowi3JlO1ClCnmTMj5S1ztB4t89yMqjf.mp4",
    "س": "https://sshi.sa/api/file/atUaVfvubF32EGj42QyKpzCvepa7bCOs.mp4",
    "ش": "https://sshi.sa/api/file/ysz6SY4PoThwPc8lpXNUU11jBCekIRTm.mp4",
    "ص": "https://sshi.sa/api/file/ATh9c7RO0UqIuT52RMeyINAhpJX6ODmk.mp4",
    "ض": "https://sshi.sa/api/file/jO0wepvmV3MifTwjSQ9FzvXQqJph5qc8.mp4",
    "ط": "https://sshi.sa/api/file/5Ai80ouOdg41LZcI3ojG3PqxsWqNx5kp.mp4",
    "ظ": "https://sshi.sa/api/file/Tx1zMu7820Qcx61A8TKzBg5iLDtcKRp9.mp4",
    "ع": "https://sshi.sa/api/file/HNoj9kwhYI4v0y0JWQEGv2AXFP1GwqQ2.mp4",
    "غ": "https://sshi.sa/api/file/MHb98CnXsZqXVhqMUytZ7tB1r5LB85KU.mp4",
    "ف": "https://sshi.sa/api/file/X4sROpSZSuZeBAgL4b6YltYR7ibWWp8L.mp4",
    "ق": "https://sshi.sa/api/file/954zCgxc6fsn51bbPgaqcEL8Aeg9lHw9.mp4",
    "ك": "https://sshi.sa/api/file/JKhDDQlsIzqeAqkMgkyGFsXRHdZhvUNN.mp4",
    "ل": "https://sshi.sa/api/file/m7ciqugvNziEzcQSQthKQYDNptllbA7e.mp4",
    "لا": "https://sshi.sa/api/file/aHjBj6SMGwcd9o4G81x61DzgfxqgVBB4.mp4",
    "م": "https://sshi.sa/api/file/1yKvVViVwjhlp9eRRDRzQRhDTQ3nHwqL.mp4",
    "ن": "https://sshi.sa/api/file/OiSRFw6Tup0WsEpvY4YEIsejuM7MewDo.mp4",
    "ه": "https://sshi.sa/api/file/0iAxgUbIniKNoJ15icEB10T5gTBkpxWd.mp4",
    "و": "https://sshi.sa/api/file/YkbxrtrougujI66XqPI8jzoTTVKs5bC3.mp4",
    "ؤ": "https://sshi.sa/api/file/pSNKu9BEw70zDaR6fYF0MCe8d5FZtINP.mp4",
    "ى": "https://sshi.sa/api/file/HX7eDd74eGipQnjAimn9Z6U8yeLgWBUb.mp4",
    "ي": "https://sshi.sa/api/file/ghet2fvX8Sdq5IKJjkrWEqcjVLuM1PyX.mp4",
    "ئ": "https://sshi.sa/api/file/sw1F8tkmguB8NiKCWwBXdDmYvvgX8gzu.mp4",


    "1": "https://sshi.sa/api/file/i7eZnMxVaK9N5Z3r69L7caOPRfrNDiTi.mp4",
    "2": "https://sshi.sa/api/file/Ukxpx8zErrcnUQMag5I7JRcjhTCctUBW.mp4",
    "3": "https://sshi.sa/api/file/0Yla7KOKvtV38aYDhrYxxbatBaaQxVPy.mp4",
    "4": "https://sshi.sa/api/file/1PXqotb1kr9E9C9Hgfn8Z4axK57vrjW3.mp4",
    "5": "https://sshi.sa/api/file/8FEXOs76v3bcXbaAq3JpnyYcWea8VR8I.mp4",
    "6": "https://sshi.sa/api/file/YBUaadba8Svg9dCa2cOlaUUSHG00cyrU.mp4",
    "7": "https://sshi.sa/api/file/gdWIaY8AmhwtWV2mLXKUB5tUWKafKaOg.mp4",
    "8": "https://sshi.sa/api/file/E33LBNJGOCXrZ7FltxxEacsEo3vZtl8z.mp4",
    "9": "https://sshi.sa/api/file/UPm5mA2noxSrjwq6jNky0p80weLZMUYO.mp4",
    "10": "https://sshi.sa/api/file/uIAH8hpZTe0TDdJA0AzqBOSQfgLNg2RB.mp4",
    "11": "https://sshi.sa/api/file/JPe5pPcbkZFHnZHZPDd2InTGu9xF0VH7.mp4",
    "12": "https://sshi.sa/api/file/3Qo0h1cJ2sLoeuamEvR2culPp59IWHSy.mp4",
    "13": "https://sshi.sa/api/file/rijv8Ou6yJMfyDLOSGJkKyaarJnDCNMG.mp4",
    "14" : "https://sshi.sa/api/file/VYdaqJe2Xka42SwcFgPfd6togoWSKQt3.mp4",
    "15" : "https://sshi.sa/api/file/QTHPYsoCvzfDQsSwgurARvqJVDM7iaen.mp4",
    "20" : "https://sshi.sa/api/file/Fy75bph9Zp7FF1gn6BaDYoig387rUfzI.mp4",
    "21" : "https://sshi.sa/api/file/NCdkiKEfhohvDfjCGL0UsXRmwkyTVv4o.mp4",
    "22" : "https://sshi.sa/api/file/7C2l6NaaiKYCYQgcavpgvu7zWHfkIKGF.mp4",
    "23" : "https://sshi.sa/api/file/B2wb6J0Aiz6NAzLV8jb7lQyVIiRyh6df.mp4",
    "24" : "https://sshi.sa/api/file/qEeNSj2vNZk1tRC3MHmk5LhOfIZRXWz9.mp4",
    "25" : "https://sshi.sa/api/file/zNRYiFYudgG0lVEPkE6uhYr76vonj6UP.mp4",
    "30" : "https://sshi.sa/api/file/ruAsF6xLboOldbRw6oiUbpzd6WBUGaJz.mp4",
    "31" : "https://sshi.sa/api/file/aiCoU5mPZBH849qXwqcQsTydllIqblLl.mp4",
    "32" : "https://sshi.sa/api/file/opwiUNEB1nkKixdBvmWkmaUw4sBkLp60.mp4",
    "33" : "https://sshi.sa/api/file/0bI5IIQBAFdzIfHIIBsw5qsPFF2bT5wd.mp4",
    "34" : "https://sshi.sa/api/file/EIVA5r8FEL269X17vHeAm7oepRF96nPh.mp4",
    "35" : "https://sshi.sa/api/file/SuR0JbwZRvzvx7U5y737BeuEl8xjhCHA.mp4",
    "40" : "https://sshi.sa/api/file/mDdP4ZsmYnmLM1Pg3sDmQVjEpMyxp4Pr.mp4",
    "41" : "https://sshi.sa/api/file/Mu8gklbrPririuTmNeN5Ty07lgZViqZo.mp4",
    "42" : "https://sshi.sa/api/file/YdGzsGDxlWKz6z9r7c0vaZR5lWcnFAX5.mp4",
    "43" : "https://sshi.sa/api/file/UDEi9wPfgmCFHBvfxnyDpCaWpRryuaB2.mp4",
    "44" : "https://sshi.sa/api/file/WfocpVj0BaEoOadQaWx46UT7WKq4W3QX.mp4",
    "45" : "https://sshi.sa/api/file/XexczFykNjoqTLTblV0uVzXMo4pbmQ3R.mp4",
    "50" : "https://sshi.sa/api/file/mRsNDBgseI3minYxE32HcAMxRWbZpOZ3.mp4",
    "60" : "https://sshi.sa/api/file/ygJgPj6EoDC0gP5nAVdkg4tF2kVsEcYQ.mp4",
    "70" : "https://sshi.sa/api/file/9VpPA49OOnMxKpfyEepw3UpuGFp3vLcM.mp4",
    "80" : "https://sshi.sa/api/file/839tRV1asCXo7bUuzDkaB2Bx5ZwvPYwM.mp4",
    "90" : "https://sshi.sa/api/file/ludOaJVgaX5yohXKRZztKI8KOujI7etS.mp4",
    "100" : "https://sshi.sa/api/file/nQcnDYXAN7GSzxnJyiEPm69B2kyIBq5T.mp4",
    "1000" : "https://sshi.sa/api/file/EYe43creuJoOJSqhgYU2q8OH6mKAKS5W.mp4",
    "10000" : "https://sshi.sa/api/file/Ny4MFrVrY6mNZMg5tXkVlbopMDhR405i.mp4",
    "100000" : "https://sshi.sa/api/file/opSsBHAv28DC32M8G3hmS4XlHW6YVZhs.mp4",
    "1000000" : "https://sshi.sa/api/file/1X5xZEEgl4HqjcIbI3MygkYBYi1HaLN2.mp4",
    "30" : "dfdfgfg",
    "30" : "dfdfgfg",


  };
  return letterMap[letter] || null;
}


function addVideoToList(videoLink, label,index) {
  const wordList = document.getElementById("wordList");
  const listItem = document.createElement("li");
  listItem.innerText = label;
  listItem.id = `word-${index}`;
  listItem.style.cursor = "pointer";
  listItem.addEventListener("click", () => {
      const videoPlayer = document.getElementById("videoPlayer");
      videoPlayer.src = videoLink;
      videoPlayer.play().catch(error => console.error("Playback failed:", error));
  });
  wordList.appendChild(listItem);
  videoSource.push(videoLink);
}