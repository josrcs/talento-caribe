/* chat.js - Asistente de la página de inicio: usa el mismo componente completo (asistente-ia.js). */
(() => {
  const caja = document.querySelector("#chat-inicio");
  if (caja && window.TCChatUI) TCChatUI.montar(caja, { modo: "inicio" });
})();
