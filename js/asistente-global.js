/* Asistente flotante: disponible en todas las páginas. Usa TCChatUI (asistente-ia.js).
   Se puede ampliar a pantalla casi completa y conserva el historial por usuario. */
(() => {
  if (document.querySelector("#tc-chat-widget") || !window.TCChatUI) return;
  const root = document.createElement("section");
  root.id = "tc-chat-widget"; root.className = "tc-chat-widget"; root.setAttribute("aria-label", "Asistente de Talento Caribe");
  root.innerHTML = '<button class="tc-chat-launch" type="button" aria-expanded="false" aria-controls="tc-chat-panel"><span class="tc-chat-launch-icon" aria-hidden="true"></span><span class="tc-chat-launch-label">Asistente IA</span></button><div class="tc-chat-panel" id="tc-chat-panel" hidden></div>';
  document.body.append(root);
  const launch = root.querySelector(".tc-chat-launch"), panel = root.querySelector(".tc-chat-panel");
  let chat = null;

  function abrir(valor) {
    launch.setAttribute("aria-expanded", String(valor));
    panel.hidden = !valor;
    root.classList.toggle("is-abierto", valor);
    if (valor) {
      if (!chat) chat = TCChatUI.montar(panel, {
        modo: "flotante", ampliable: true, cerrable: true,
        alCerrar: () => abrir(false),
        alNavegar: () => abrir(false),
        alAmpliar: (btn) => { const on = root.classList.toggle("is-ampliado"); btn.innerHTML = TCIcono(on ? "reducir" : "ampliar", 18); },
      });
      chat.enfocar();
    } else { root.classList.remove("is-ampliado"); launch.focus(); }
  }
  launch.addEventListener("click", () => abrir(launch.getAttribute("aria-expanded") !== "true"));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) abrir(false); });
  window.TCAbrirAsistente = (pregunta) => { abrir(true); if (pregunta) chat.enviar(pregunta); };
  window.TCChat = { responder: (t) => TCAsistente.responderLocal(t).texto };
})();
