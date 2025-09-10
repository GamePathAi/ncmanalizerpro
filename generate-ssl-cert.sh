#!/bin/bash

# Script para gerar certificado SSL para ambos os domínios
# Execute este script no servidor de produção

echo "Gerando certificado SSL para ncmanalyzerpro.com.br e www.ncmanalyzerpro.com.br..."

# Parar o nginx temporariamente
sudo systemctl stop nginx

# Gerar certificado para ambos os domínios
sudo certbot certonly --standalone \
  -d ncmanalyzerpro.com.br \
  -d www.ncmanalyzerpro.com.br \
  --email seu-email@exemplo.com \
  --agree-tos \
  --no-eff-email

# Verificar se o certificado foi gerado com sucesso
if [ $? -eq 0 ]; then
    echo "Certificado SSL gerado com sucesso!"
    
    # Verificar os domínios incluídos no certificado
    echo "Domínios incluídos no certificado:"
    sudo openssl x509 -in /etc/letsencrypt/live/ncmanalyzerpro.com.br/fullchain.pem -text -noout | grep -A 1 "Subject Alternative Name"
    
    # Reiniciar o nginx
    sudo systemctl start nginx
    sudo systemctl reload nginx
    
    echo "Nginx reiniciado com sucesso!"
    echo "Testando configuração do nginx..."
    sudo nginx -t
    
else
    echo "Erro ao gerar o certificado SSL!"
    # Reiniciar o nginx mesmo em caso de erro
    sudo systemctl start nginx
    exit 1
fi

echo "Configuração concluída!"
echo "Agora você pode acessar:"
echo "- https://ncmanalyzerpro.com.br"
echo "- https://www.ncmanalyzerpro.com.br"