#  Web Scraper Email - Tech News

Um projeto de automação que realiza scraping de notícias do site Hacker News e envia por e-mail um resumo das principais manchetes do dia.

## Funcionalidades
- Scraping inteligente do Hacker News com tratamento de erros.
- Configuração flexível via arquivo JSON ou variáveis de ambiente.
- Tratamento de erros completo e logs detalhados.
  
## Tecnologias Utilizadas
- [Node.js](https://nodejs.org/)
- [Axios](Cliente HTTP para requisições)
- [Nodemailer](Envio de emails via SMTP)
- [Cheerio](jQuery server-side para parsing HTML)
  
## Instalação

1. Clone o repositório:
   ```sh
   git clone <url-do-repo>   
   ```
2. Instale as dependências:
   ```sh
   npm install
   ```

## Configuração do Gmail

1. Ative a verificação em duas etapas na sua conta Google.

2. Gere uma "Senha de App"
- Acesse(`https://myaccount.google.com/`)
- Vá em "Segurança" > "Senhas de app"
- Gere uma nova senha para "Mail"
- Use a senha de app no campo "emailPassword" dentro do arquivo: `config.json`
- Para se enviar um E-mail, coloque em ambos compos o seu próprio E-mail com a senha gerada anteriormente: `fromEmail` e `toEmail`
  
4. Execução:
   ```sh
   npm start
   ```
   
## Configuração
- O backend deve estar disponível em: `https://github.com/MechamoGui/Desafio---Email-Scrap`





