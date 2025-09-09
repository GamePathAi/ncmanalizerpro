# Guia de Deploy - NCM Analyzer Pro

Este guia fornece instruções completas para fazer deploy da aplicação NCM Analyzer Pro no domínio `ncmanalizerpro.com.br` usando AWS EC2 e Nginx.

## 📋 Pré-requisitos

- Conta AWS ativa
- Domínio `ncmanalizerpro.com.br` registrado
- Chaves SSH configuradas
- Node.js 18+ instalado localmente

## 🚀 Passo 1: Configurar Instância EC2

### 1.1 Criar Instância EC2
```bash
# Especificações recomendadas:
# - Tipo: t3.small ou superior
# - OS: Ubuntu 22.04 LTS
# - Storage: 20GB SSD
# - Security Group: HTTP (80), HTTPS (443), SSH (22)
```

### 1.2 Conectar à Instância
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### 1.3 Atualizar Sistema
```bash
sudo apt update && sudo apt upgrade -y
```

## 🔧 Passo 2: Instalar Dependências no Servidor

### 2.1 Instalar Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2.2 Instalar Certbot (SSL)
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 2.3 Instalar Node.js (opcional, para futuras atualizações)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 🌐 Passo 3: Configurar DNS

### 3.1 Configurar Route 53 (AWS)
1. Acesse o console AWS Route 53
2. Crie uma Hosted Zone para `ncmanalizerpro.com.br`
3. Adicione os seguintes registros:

```
# Registro A
Name: ncmanalizerpro.com.br
Type: A
Value: [IP-DA-SUA-INSTANCIA-EC2]

# Registro A para www
Name: www.ncmanalizerpro.com.br
Type: A
Value: [IP-DA-SUA-INSTANCIA-EC2]
```

### 3.2 Atualizar Nameservers
No seu registrador de domínio, atualize os nameservers para os fornecidos pelo Route 53.

## 🔐 Passo 4: Configurar SSL

```bash
# Obter certificado SSL
sudo certbot --nginx -d ncmanalizerpro.com.br -d www.ncmanalizerpro.com.br

# Configurar renovação automática
sudo crontab -e
# Adicionar linha:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 📦 Passo 5: Preparar Aplicação para Deploy

### 5.1 Configurar Variáveis de Ambiente
1. Copie `.env.production` para `.env`
2. Atualize com suas chaves reais:

```bash
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_supabase

# Stripe (Production)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_sua_chave_stripe
VITE_STRIPE_ANNUAL_PRICE_ID=price_seu_id_anual
VITE_STRIPE_LIFETIME_PRICE_ID=price_seu_id_vitalicio
```

### 5.2 Testar Build Local
```bash
npm run build
npm run preview
```

## 🚀 Passo 6: Deploy Automatizado

### 6.1 Configurar Script de Deploy
1. Edite `deploy.sh` e atualize:
```bash
REMOTE_HOST="seu-ip-ec2"
```

2. Torne o script executável:
```bash
chmod +x deploy.sh
```

### 6.2 Executar Deploy
```bash
./deploy.sh production
```

## 🔧 Passo 7: Deploy Manual (Alternativo)

Se preferir fazer deploy manual:

### 7.1 Build e Upload
```bash
# Local
npm run build
scp -r dist/* ubuntu@seu-ip:/var/www/ncmanalizerpro/
scp nginx.conf ubuntu@seu-ip:/tmp/
```

### 7.2 Configurar no Servidor
```bash
# No servidor EC2
sudo mkdir -p /var/www/ncmanalizerpro
sudo chown -R www-data:www-data /var/www/ncmanalizerpro
sudo cp /tmp/nginx.conf /etc/nginx/sites-available/ncmanalizerpro
sudo ln -s /etc/nginx/sites-available/ncmanalizerpro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔍 Passo 8: Verificação

### 8.1 Testar Aplicação
```bash
# Verificar se o site está respondendo
curl -I https://ncmanalizerpro.com.br

# Verificar SSL
ssl-cert-check -c ncmanalizerpro.com.br
```

### 8.2 Monitoramento
```bash
# Logs do Nginx
sudo tail -f /var/log/nginx/ncmanalizerpro_access.log
sudo tail -f /var/log/nginx/ncmanalizerpro_error.log

# Status do Nginx
sudo systemctl status nginx
```

## 🔄 Passo 9: Atualizações Futuras

Para futuras atualizações:

```bash
# Método 1: Script automatizado
./deploy.sh production

# Método 2: Manual
npm run build
scp -r dist/* ubuntu@seu-ip:/var/www/ncmanalizerpro/
```

## 🛠️ Troubleshooting

### Problema: Site não carrega
```bash
# Verificar status do Nginx
sudo systemctl status nginx

# Verificar configuração
sudo nginx -t

# Verificar logs
sudo tail -f /var/log/nginx/error.log
```

### Problema: SSL não funciona
```bash
# Renovar certificado
sudo certbot renew

# Verificar configuração SSL
sudo nginx -t
```

### Problema: Aplicação React não carrega rotas
Verifique se a configuração `try_files $uri $uri/ /index.html;` está presente no Nginx.

## 📊 Monitoramento e Backup

### Backup Automático
```bash
# Adicionar ao crontab
0 2 * * * tar -czf /backup/ncmanalizerpro-$(date +\%Y\%m\%d).tar.gz /var/www/ncmanalizerpro
```

### Monitoramento de Uptime
Considere usar serviços como:
- AWS CloudWatch
- UptimeRobot
- Pingdom

## 🎉 Conclusão

Após seguir todos os passos, sua aplicação NCM Analyzer Pro estará disponível em:
- https://ncmanalizerpro.com.br
- https://www.ncmanalizerpro.com.br

Com SSL configurado, compressão Gzip ativa e otimizações de performance implementadas.

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs do Nginx
2. Confirme se todas as variáveis de ambiente estão corretas
3. Teste a conectividade DNS
4. Verifique se os certificados SSL estão válidos