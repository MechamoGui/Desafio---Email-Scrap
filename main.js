const axios = require('axios');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

class TechNewsScraper {
    constructor() {
        this.baseUrl = 'https://news.ycombinator.com';
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        };
    }

    async scrapeHackerNews(limit = 10) {
        try {
            console.log('🔍 Fazendo scraping do Hacker News...');
            
            const response = await axios.get(this.baseUrl, {
                headers: this.headers,
                timeout: 10000
            });

            const $ = cheerio.load(response.data);
            const stories = [];

            // Encontra as linhas de stories
            const storyRows = $('.athing').slice(0, limit);

            for (let i = 0; i < storyRows.length; i++) {
                try {
                    const story = $(storyRows[i]);
                    const storyId = story.attr('id');

                    // Título e link
                    const titleCell = story.find('.titleline');
                    const titleLink = titleCell.find('a').first();
                    
                    if (titleLink.length === 0) continue;

                    const title = titleLink.text().trim();
                    let link = titleLink.attr('href') || '';

                    // Se o link é relativo, adiciona o domínio base
                    if (link.startsWith('item?')) {
                        link = `${this.baseUrl}/${link}`;
                    }

                    // Pega informações adicionais da próxima linha
                    const nextRow = story.next('tr');
                    let points = 0;
                    let comments = 0;
                    let author = 'Unknown';

                    if (nextRow.length > 0) {
                        // Pontos
                        const scoreSpan = nextRow.find('.score');
                        if (scoreSpan.length > 0) {
                            const scoreText = scoreSpan.text();
                            const pointsMatch = scoreText.match(/(\d+)/);
                            if (pointsMatch) {
                                points = parseInt(pointsMatch[1]);
                            }
                        }

                        // Autor
                        const authorLink = nextRow.find('.hnuser');
                        if (authorLink.length > 0) {
                            author = authorLink.text().trim();
                        }

                        // Comentários
                        const commentLinks = nextRow.find('a');
                        commentLinks.each((idx, el) => {
                            const linkText = $(el).text();
                            if (linkText.includes('comment')) {
                                const commentsMatch = linkText.match(/(\d+)/);
                                if (commentsMatch) {
                                    comments = parseInt(commentsMatch[1]);
                                }
                                return false; // break
                            }
                        });
                    }

                    stories.push({
                        title,
                        link,
                        points,
                        author,
                        comments
                    });

                } catch (error) {
                    console.error(`Erro ao processar story: ${error.message}`);
                    continue;
                }
            }

            console.log(`✅ ${stories.length} notícias coletadas`);
            return stories;

        } catch (error) {
            console.error(`Erro no scraping: ${error.message}`);
            return [];
        }
    }
}

class EmailSender {
    constructor(config) {
        this.config = config;
        this.transporter = nodemailer.createTransport({
            host: config.smtpServer,
            port: config.smtpPort,
            secure: config.smtpPort === 465, // true para 465, false para outros
            auth: {
                user: config.fromEmail,
                pass: config.emailPassword
            }
        });
    }

    createHtmlEmail(stories) {
        const currentDate = new Date().toLocaleDateString('pt-BR');
        const currentTime = new Date().toLocaleString('pt-BR');
        
        let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    margin: 0; 
                    padding: 0;
                    background-color: #f5f5f5;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: white;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                }
                .header { 
                    background: linear-gradient(135deg, #ff6600, #ff8533);
                    color: white; 
                    padding: 30px 20px; 
                    text-align: center; 
                }
                .header h1 {
                    margin: 0 0 10px 0;
                    font-size: 28px;
                    font-weight: 300;
                }
                .header p {
                    margin: 0;
                    opacity: 0.9;
                    font-size: 16px;
                }
                .content {
                    padding: 20px;
                }
                .story { 
                    border-bottom: 1px solid #eee; 
                    padding: 20px 0; 
                    margin: 0;
                    transition: background-color 0.3s ease;
                }
                .story:hover {
                    background-color: #fafafa;
                }
                .story:last-child {
                    border-bottom: none;
                }
                .story-number {
                    display: inline-block;
                    background-color: #ff6600;
                    color: white;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    text-align: center;
                    line-height: 24px;
                    font-size: 12px;
                    font-weight: bold;
                    margin-right: 12px;
                    vertical-align: top;
                    margin-top: 2px;
                }
                .story-title { 
                    font-size: 18px; 
                    font-weight: 600; 
                    margin-bottom: 8px; 
                    display: inline-block;
                    width: calc(100% - 36px);
                    vertical-align: top;
                }
                .story-title a { 
                    color: #333; 
                    text-decoration: none; 
                    line-height: 1.4;
                }
                .story-title a:hover { 
                    color: #ff6600; 
                    text-decoration: underline;
                }
                .story-meta { 
                    color: #666; 
                    font-size: 14px; 
                    margin-left: 36px;
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                }
                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .footer { 
                    text-align: center; 
                    padding: 30px 20px; 
                    background-color: #f8f9fa;
                    color: #666;
                    border-top: 1px solid #eee;
                }
                .footer p {
                    margin: 5px 0;
                    font-size: 14px;
                }
                @media (max-width: 600px) {
                    .story-number {
                        position: relative;
                        float: left;
                        margin-top: 4px;
                    }
                    .story-title {
                        width: calc(100% - 40px);
                        margin-left: 4px;
                    }
                    .story-meta {
                        margin-left: 0;
                        margin-top: 8px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚀 Top Tech News</h1>
                    <p>Principais notícias de tecnologia - ${currentDate}</p>
                </div>
                
                <div class="content">
        `;

        stories.forEach((story, index) => {
            htmlContent += `
                <div class="story">
                    <span class="story-number">${index + 1}</span>
                    <div class="story-title">
                        <a href="${story.link}" target="_blank">${story.title}</a>
                    </div>
                    <div class="story-meta">
                        <span class="meta-item">👤 ${story.author}</span>
                        <span class="meta-item">⬆️ ${story.points} pontos</span>
                        <span class="meta-item">💬 ${story.comments} comentários</span>
                    </div>
                </div>
            `;
        });

        htmlContent += `
                </div>
                
                <div class="footer">
                    <p><strong>Email gerado automaticamente pelo Web Scraper</strong></p>
                    <p>Data: ${currentTime}</p>
                    <p>Fonte: <a href="https://news.ycombinator.com" style="color: #ff6600;">Hacker News</a></p>
                </div>
            </div>
        </body>
        </html>
        `;

        return htmlContent;
    }

    createTextEmail(stories) {
        const currentDate = new Date().toLocaleDateString('pt-BR');
        let textContent = `Top Tech News - ${currentDate}\n`;
        textContent += '='.repeat(50) + '\n\n';

        stories.forEach((story, index) => {
            textContent += `${index + 1}. ${story.title}\n`;
            textContent += `   Link: ${story.link}\n`;
            textContent += `   Autor: ${story.author} | Pontos: ${story.points} | Comentários: ${story.comments}\n\n`;
        });

        textContent += `\nEmail gerado automaticamente em ${new Date().toLocaleString('pt-BR')}\n`;
        textContent += 'Fonte: https://news.ycombinator.com';

        return textContent;
    }

    async sendEmail(toEmail, subject, stories) {
        try {
            console.log('📧 Preparando email...');

            const htmlContent = this.createHtmlEmail(stories);
            const textContent = this.createTextEmail(stories);

            const mailOptions = {
                from: `"Tech News Scraper" <${this.config.fromEmail}>`,
                to: toEmail,
                subject: subject,
                text: textContent,
                html: htmlContent
            };

            console.log('📤 Enviando email...');
            const info = await this.transporter.sendMail(mailOptions);
            
            console.log('✅ Email enviado com sucesso!');
            console.log(`Message ID: ${info.messageId}`);
            return true;

        } catch (error) {
            console.error(`❌ Erro ao enviar email: ${error.message}`);
            return false;
        }
    }

    async testConnection() {
        try {
            await this.transporter.verify();
            console.log('✅ Conexão SMTP verificada com sucesso');
            return true;
        } catch (error) {
            console.error('❌ Erro na conexão SMTP:', error.message);
            return false;
        }
    }
}

class ScrapingEmailService {
    constructor(configFile = 'config.json') {
        this.config = this.loadConfig(configFile);
        this.scraper = new TechNewsScraper();
        this.emailSender = new EmailSender(this.config);
    }

    loadConfig(configFile) {
        // Configuração padrão usando variáveis de ambiente
        const defaultConfig = {
            smtpServer: process.env.SMTP_SERVER || 'smtp.gmail.com',
            smtpPort: parseInt(process.env.SMTP_PORT) || 587,
            fromEmail: process.env.FROM_EMAIL || 'SEU_EMAIL@gmail.com', // ← COLOQUE SEU EMAIL AQUI
            emailPassword: process.env.EMAIL_PASSWORD || 'SUA_SENHA_DE_APP', // ← COLOQUE SUA SENHA DE APP AQUI  
            toEmail: process.env.TO_EMAIL || 'DESTINATARIO@gmail.com', // ← COLOQUE O EMAIL DESTINATÁRIO AQUI
            storiesLimit: parseInt(process.env.STORIES_LIMIT) || 10
        };

        // Tenta carregar do arquivo de configuração
        try {
            if (require('fs').existsSync(configFile)) {
                const fileConfig = JSON.parse(require('fs').readFileSync(configFile, 'utf8'));
                Object.assign(defaultConfig, fileConfig);
                console.log(`📄 Configuração carregada de ${configFile}`);
            }
        } catch (error) {
            console.warn(`⚠️ Erro ao carregar ${configFile}: ${error.message}`);
            console.log('📄 Usando variáveis de ambiente');
        }

        return defaultConfig;
    }

    async run() {
        try {
            console.log('🚀 Iniciando Web Scraper com Email...\n');

            // Verifica configurações
            if (!this.config.fromEmail || !this.config.toEmail) {
                console.error('❌ Configurações de email não encontradas!');
                console.log('\n📋 Configure as variáveis de ambiente:');
                console.log('- FROM_EMAIL: seu email');
                console.log('- EMAIL_PASSWORD: sua senha (recomendado App Password)');
                console.log('- TO_EMAIL: email destinatário');
                console.log('\n📄 Ou crie um arquivo config.json');
                return false;
            }

            // Testa conexão SMTP
            const smtpOk = await this.emailSender.testConnection();
            if (!smtpOk) {
                console.log('\n💡 Dicas para Gmail:');
                console.log('1. Ative a verificação em duas etapas');
                console.log('2. Gere uma "Senha de App"');
                console.log('3. Use a senha de app no lugar da senha normal');
                return false;
            }

            // Faz o scraping
            const stories = await this.scraper.scrapeHackerNews(this.config.storiesLimit);

            if (stories.length === 0) {
                console.error('❌ Nenhuma notícia encontrada');
                return false;
            }

            // Envia o email
            const currentDate = new Date().toLocaleDateString('pt-BR');
            const subject = `🚀 Tech News - ${currentDate}`;

            const success = await this.emailSender.sendEmail(
                this.config.toEmail,
                subject,
                stories
            );

            if (success) {
                console.log(`\n📊 Resumo:`);
                console.log(`- ${stories.length} notícias coletadas`);
                console.log(`- Email enviado para: ${this.config.toEmail}`);
                console.log(`- Horário: ${new Date().toLocaleString('pt-BR')}`);
            }

            return success;

        } catch (error) {
            console.error(`❌ Erro no serviço: ${error.message}`);
            return false;
        }
    }

    async saveSampleConfig(filename = 'config.sample.json') {
        const sampleConfig = {
            "smtpServer": "smtp.gmail.com",
            "smtpPort": 587,
            "fromEmail": "seu_email@gmail.com",
            "emailPassword": "sua_senha_ou_app_password",
            "toEmail": "destinatario@gmail.com",
            "storiesLimit": 10
        };

        try {
            await fs.writeFile(filename, JSON.stringify(sampleConfig, null, 4));
            console.log(`📄 Arquivo de exemplo salvo: ${filename}`);
        } catch (error) {
            console.error(`Erro ao salvar arquivo: ${error.message}`);
        }
    }
}

// Função principal
async function main() {
    const service = new ScrapingEmailService();
    
    // Descomente a linha abaixo para criar um arquivo de configuração de exemplo
    // await service.saveSampleConfig();
    
    await service.run();
}

// Executa se o arquivo for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    TechNewsScraper,
    EmailSender,
    ScrapingEmailService
};