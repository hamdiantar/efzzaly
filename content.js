if (!location.href.startsWith("chrome://")) {
  document.addEventListener("mouseup", () => {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
      chrome.runtime.sendMessage({ action: "textSelected", text: selectedText });
    }
  });
}


