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
  backendUrl: 'https://script.google.com/macros/s/AKfycbyvkdyvjOv3_Yn20ojpYAuK-6QlRzJuSlvRKhlIOI3EsA0C9S0HwRsiLKLQcLK86HMu/exec',

  // Opcional. Só use se o Apps Script tiver SECRET_KEY preenchida.
  // ATENCAO: este repositorio e publico. Nao coloque a senha aqui — quem
  // digita a chave no site (Ajustes) guarda so neste aparelho.
  accessKey: '',

  // De quanto em quanto tempo (em segundos) o site busca novidades do outro aparelho
  pollSeconds: 20
};
