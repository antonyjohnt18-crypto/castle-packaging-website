window.CPChatConfig = {
  apiBaseUrl: "https://castle-business-api-sandbox-pdymm.ondigitalocean.app",
  sharedSecret: "sandbox-chat-x7k2m9",
};

function isChatConfigured() {
  return !!(window.CPChatConfig && window.CPChatConfig.sharedSecret && !String(window.CPChatConfig.sharedSecret).startsWith("PASTE_"));
}
window.isChatConfigured = isChatConfigured;
