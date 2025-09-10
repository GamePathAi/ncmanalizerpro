#!/bin/bash

# Script para configurar redirecionamento do domínio antigo (ncmanalyzer.com.br) 
# para o novo (ncmanalyzerpro.com.br)

echo "=== Configurando Redirecionamento de Domínio ==="
echo ""

# Backup da configuração atual
echo "Fazendo backup da configuração atual do nginx..."
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S)

# Criar configuração para redirecionamento do domínio antigo
echo "Criando configuração de redirecionamento..."

cat > /tmp/redirect-old-domain.conf << 'EOF'
# Redirecionamento do domínio antigo para o novo
server {
    listen 80;
    server_name ncmanalyzer.com.br www.ncmanalyzer.com.br;
    
    # Redirecionar para o novo domínio
    return 301 https://ncmanalyzerpro.com.br$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ncmanalyzer.com.br www.ncmanalyzer.com.br;
    
    # Certificado SSL (pode usar o mesmo ou gerar um específico)
    ssl_certificate /etc/letsencrypt/live/ncmanalyzerpro.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ncmanalyzerpro.com.br/privkey.pem;
    
    # Configurações SSL básicas
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    
    # Redirecionar para o novo domínio
    return 301 https://ncmanalyzerpro.com.br$request_uri;
}
EOF

# Copiar configuração para o nginx
sudo cp /tmp/redirect-old-domain.conf /etc/nginx/sites-available/redirect-ncmanalyzer

# Ativar o site
sudo ln -sf /etc/nginx/sites-available/redirect-ncmanalyzer /etc/nginx/sites-enabled/

# Testar configuração
echo "Testando configuração do nginx..."
if sudo nginx -t; then
    echo "✓ Configuração válida!"
    
    # Recarregar nginx
    echo "Recarregando nginx..."
    sudo systemctl reload nginx
    
    echo "✓ Redirecionamento configurado com sucesso!"
    echo ""
    echo "Agora o domínio antigo (ncmanalyzer.com.br) redirecionará para o novo (ncmanalyzerpro.com.br)"
    echo ""
    echo "Para testar:"
    echo "curl -I http://ncmanalyzer.com.br"
    echo "curl -I https://ncmanalyzer.com.br"
    
else
    echo "✗ Erro na configuração do nginx!"
    echo "Removendo configuração problemática..."
    sudo rm -f /etc/nginx/sites-enabled/redirect-ncmanalyzer
    exit 1
fi

# Opcional: Gerar certificado SSL específico para o domínio antigo
read -p "Deseja gerar um certificado SSL específico para o domínio antigo? (y/n): " generate_ssl

if [ "$generate_ssl" = "y" ] || [ "$generate_ssl" = "Y" ]; then
    echo "Gerando certificado SSL para o domínio antigo..."
    
    # Parar nginx temporariamente
    sudo systemctl stop nginx
    
    # Gerar certificado
    sudo certbot certonly --standalone \
        -d ncmanalyzer.com.br \
        -d www.ncmanalyzer.com.br \
        --email seu-email@exemplo.com \
        --agree-tos \
        --no-eff-email
    
    if [ $? -eq 0 ]; then
        echo "✓ Certificado SSL gerado com sucesso!"
        
        # Atualizar configuração para usar o novo certificado
        sudo sed -i 's|/etc/letsencrypt/live/ncmanalyzerpro.com.br/|/etc/letsencrypt/live/ncmanalyzer.com.br/|g' /etc/nginx/sites-available/redirect-ncmanalyzer
        
        echo "✓ Configuração atualizada para usar o certificado específico"
    else
        echo "⚠ Erro ao gerar certificado SSL. Usando certificado do domínio principal."
    fi
    
    # Reiniciar nginx
    sudo systemctl start nginx
    sudo systemctl reload nginx
fi

echo ""
echo "=== Configuração Finalizada ==="
echo "Redirecionamento configurado:"
echo "  ncmanalyzer.com.br -> ncmanalyzerpro.com.br"
echo "  www.ncmanalyzer.com.br -> ncmanalyzerpro.com.br"
echo ""
echo "Para verificar:"
echo "  curl -I http://ncmanalyzer.com.br"
echo "  curl -I https://www.ncmanalyzer.com.br"