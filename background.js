chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && !tab.url.startsWith("chrome://")) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["content.js"],
    });
  }
});


chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "setInputText",
    title: "افزع لي: تحويل النص إلى لغة الإشارة",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "setInputText" && info.selectionText) {
    chrome.storage.local.set({ selectedText: info.selectionText });
    chrome.windows.create({
      url: "popup.html",
      type: "popup",
      width: 400,
      height: 600
    });
  }
});