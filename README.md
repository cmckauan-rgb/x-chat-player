# X Chat Player

Protótipo web para autenticação OAuth 2.0 + PKCE com X e futura leitura/reprodução de mídia do X Chat.

## GitHub Pages

URL esperada:

- Site: `https://cmckauan-rgb.github.io/x-chat-player/`
- Callback OAuth: `https://cmckauan-rgb.github.io/x-chat-player/callback.html`

## Segurança

- Não coloque Client Secret, Access Token, Refresh Token, PIN do X Chat ou chaves privadas no repositório.
- O Client ID é público e pode ser informado pela interface; ele fica apenas no `localStorage` do navegador.
- O protótipo usa PKCE e foi pensado como cliente público (Native App/Single Page App no console do X).

## Etapas

1. Publicar este repositório no GitHub Pages.
2. No X Developer Console, configurar o app como cliente público e cadastrar exatamente a Callback URI acima.
3. Abrir o site, informar o Client ID e iniciar o login.
4. Depois do OAuth funcionando, integrar o X Chat API + Chat XDK para descriptografar e reproduzir as mídias.

> X Chat é criptografado. A reprodução real das mídias exige o Chat XDK e as chaves da conversa; não basta usar diretamente a URL `ton.x.com`.
