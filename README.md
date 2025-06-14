🚀 Instalação Rápida
bash# Clone ou crie o projeto
npm install

# Configure suas credenciais (veja seção de configuração)
# Execute
npm start

🔐 Configuração do Gmail
Ative a verificação em duas etapas:

Acesse myaccount.google.com
Vá em "Segurança" → "Verificação em duas etapas"

Gere uma Senha de App:

Em "Senhas de app", gere uma nova
Use essa senha no lugar da sua senha normal

Configure o projeto:
1. abra o arquivo "config.json"
2. Altere os campos de: "seu_email@gmail.com" pelo seu E-mail e "destinatario@gmail.com" pelo E-mail que deseja enviar, com sua senha gerada anteriormente, coloque no  "senha_de_app_gerada"
json{
    "smtpServer": "smtp.gmail.com",
    "smtpPort": 587,
    "fromEmail": "seu_email@gmail.com",
    "emailPassword": "senha_de_app_gerada",
    "toEmail": "destinatario@gmail.com"
}

🎯 Uso
Execução Simples
npm start
