# Feito de Nós

Site de **custos, catálogo e vendas** do Feito de Nós. Roda inteiro no navegador e,
se você quiser, passa a guardar os dados numa planilha do Google para que **duas
pessoas vejam exatamente a mesma coisa** em aparelhos diferentes.

- Site no ar: <https://feito-de-nos-site.vercel.app>
- Código: <https://github.com/wspontes/feito-de-nos>

## O que tem aqui

| Arquivo | Para que serve |
|---|---|
| `index.html` | O site inteiro: HTML, CSS e JavaScript em um arquivo só |
| `config.js` | Configuração: URL do backend, chave de acesso e intervalo de atualização |
| `backend-apps-script.js` | Backend (Google Apps Script) que guarda os dados numa planilha |
| `test/sync.test.mjs` | Teste da sincronização — roda sem navegador |

## Rodar local

Abra o `index.html` no navegador ou sirva a pasta com qualquer servidor estático.
Não tem build nem dependência: é HTML puro.

## Banco compartilhado (os dois aparelhos veem a mesma coisa)

1. Crie uma planilha nova no Google Drive (pode chamar **Feito de Nós — Dados**).
2. Nela, abra **Extensões → Apps Script**.
3. Apague o código que já estiver lá e cole o `backend-apps-script.js`
   (o site tem um botão **Copiar código do backend** que faz isso por você).
4. **Deploy → Nova implantação**:
   - Tipo: **Aplicativo da Web**
   - Executar como: **Eu**
   - Quem tem acesso: **Qualquer pessoa**
5. Copie a URL gerada (`https://script.google.com/macros/s/.../exec`).
6. No site, vá em **Ajustes → Banco de dados compartilhado**, cole a URL e clique
   em **Salvar e conectar**.
7. Se o banco estiver vazio, clique em **Enviar dados deste aparelho** — o botão
   aparece só depois que a conexão funciona, para nunca sobrescrever o banco
   com os dados de exemplo por engano.

### O outro aparelho já abrir conectado

Duas formas, sem precisar colar a URL na mão de novo:

- **Pelo link**: mande `https://feito-de-nos-site.vercel.app?backend=SUA_URL`
- **Pelo repositório**: preencha `backendUrl` no `config.js` e salve no GitHub.
  O Vercel publica sozinho.

Em ambos os casos a URL do aparelho é guardada no `localStorage`, então dá para
desconectar e reconectar pela tela de Ajustes quando quiser.

## Chave de acesso (opcional, recomendado)

A URL do Apps Script vale como uma senha: quem tiver o link pode ler e
escrever no banco. Para travar:

1. No Apps Script, preencha `const SECRET_KEY = 'uma senha';`
2. No site, preencha **Chave de acesso** com a mesma senha (ou `accessKey` no `config.js`).

Sem a chave certa, o backend responde `Chave de acesso invalida` e não mexe em nada.

## Como a sincronização funciona

- Ao abrir o site, ele **lê** o banco e substitui os dados locais.
- A cada alteração, ele **grava** (com um intervalo de 0,7 s para juntar edições
  seguidas em uma gravação só).
- Ele volta a **procurar novidades** a cada 20 segundos (`pollSeconds` no `config.js`),
  então o outro aparelho aparece atualizado sem recarregar a página.
- Se o backend estiver fora do ar, o site **mantém os dados locais** e mostra
  `Erro ao sincronizar` — nunca apaga o que está na tela.
- Cada gravação leva um carimbo de tempo. Se o aparelho tem alteração mais nova
  que o banco, ele **sobe a alteração** em vez de aceitar a versão velha.
- Se duas pessoas editarem ao mesmo tempo, vale a última gravação (last write wins).

## Testes

```bash
node test/sync.test.mjs
```

O teste simula dois aparelhos e um backend e confere: banco vazio não recebe
amostra, erro de backend não apaga dados, alteração em um aparelho chega no
outro, chave de acesso vai no lugar certo e alteração local mais nova não é
sobrescrita.

Feito de Nós · Desenvolvido por Weslley Silva
