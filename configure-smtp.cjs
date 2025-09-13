const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const key = process.env.RESEND_API_KEY;

if (!key) {
  console.error('RESEND_API_KEY não encontrada no .env. Por favor, adicione-a ao arquivo .env.');
  process.exit(1);
}

const configPath = path.join(__dirname, 'supabase', 'config.toml');
let config = fs.readFileSync(configPath, 'utf8');

// Configurações SMTP
const smtpConfig = `
[auth.smtp]
host = "smtp.resend.com"
port = 587
user = "resend"
password = "${key}"
sender_name = "NCM Pro"
`;

// Configuração de expiração do token (24h em segundos)
const authConfig = `
[auth]
confirmation_expiry = 86400
`;

// Template de email responsivo
const templateConfig = `
[auth.email.template.confirmation]
subject = "Confirme seu cadastro no NCM Pro"
content = """<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    a { background-color: #4CAF50; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; }
    @media only screen and (max-width: 600px) { body { padding: 10px; } }
  </style>
</head>
<body>
  <h1>Bem-vindo ao NCM Pro!</h1>
  <p>Para confirmar seu email, clique no link abaixo:</p>
  <a href="{ .ConfirmationURL }">Confirmar Email</a>
  <p>Este link expira em 24 horas.</p>
  <p>Se você não solicitou isso, ignore este email.</p>
</body>
</html>"""
`;

// Adicionar ou substituir seções
const updateSection = (config, sectionName, newContent) => {
  const regex = new RegExp(`\\[${sectionName}\\][\\s\\S]*?(?=\\[|$)`, 'g');
  if (regex.test(config)) {
    return config.replace(regex, newContent.trim());
  } else {
    return config + '\n' + newContent.trim();
  }
};

config = updateSection(config, 'auth.smtp', smtpConfig);
config = updateSection(config, 'auth', authConfig + '\n'); // Adiciona ao [auth] existente
config = updateSection(config, 'auth.email.template.confirmation', templateConfig);

// Escrever de volta no arquivo
fs.writeFileSync(configPath, config);
console.log('Configuração do Supabase atualizada com sucesso para usar Resend SMTP e template customizado.');