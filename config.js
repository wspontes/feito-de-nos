/**
 * Feito de Nós — configuração do site.
 *
 * Preencha a URL do backend (Apps Script) aqui e salve no GitHub/Vercel:
 * quem abrir o site já entra conectado ao banco compartilhado, sem precisar
 * colar a URL na mão em cada aparelho.
 *
 * A URL é a que o Google entrega no deploy, no formato:
 *   https://script.google.com/macros/s/XXXXXXXXXXXXXXXX/exec
 */
window.FN_CONFIG = {
  // URL do Apps Script (deixe vazio para configurar pelo próprio site)
  backendUrl: '',

  // Opcional. Se preencher, o mesmo valor precisa estar no Apps Script
  // (const SECRET_KEY = '...'). Protege o banco caso a URL vaze.
  accessKey: '',

  // De quanto em quanto tempo (em segundos) o site busca novidades do outro aparelho
  pollSeconds: 20
};
