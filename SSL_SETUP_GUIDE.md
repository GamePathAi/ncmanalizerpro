# Guia de Configuração SSL para Ambos os Domínios

## Objetivo
Configurar certificados SSL para que ambos os domínios funcionem:
- `ncmanalyzerpro.com.br`
- `www.ncmanalyzerpro.com.br`

## Pré-requisitos
1. Acesso SSH ao servidor de produção
2. Certbot instalado no servidor
3. Nginx configurado (já está correto no arquivo `nginx.conf`)
4. Domínios apontando para o servidor (DNS configurado)

## Passos para Configuração

### 1. Verificar DNS
Antes de gerar os certificados, verifique se ambos os domínios estão apontando para o servidor:

```bash
# Verificar DNS
nslookup ncmanalyzerpro.com.br
nslookup www.ncmanalyzerpro.com.br
```

### 2. Executar o Script de Geração SSL

```bash
# Copiar o script para o servidor
scp generate-ssl-cert.sh usuario@servidor:/home/usuario/

# Conectar ao servidor
ssh usuario@servidor

# Dar permissão de execução
chmod +x generate-ssl-cert.sh

# Executar o script
./generate-ssl-cert.sh
```

### 3. Verificar Configuração

Após executar o script, verifique:

```bash
# Testar configuração do nginx
sudo nginx -t

# Verificar status do nginx
sudo systemctl status nginx

# Verificar certificados
sudo certbot certificates
```

### 4. Testar os Domínios

Teste ambos os domínios no navegador:
- https://ncmanalyzerpro.com.br
- https://www.ncmanalyzerpro.com.br

### 5. Configurar Renovação Automática

```bash
# Testar renovação
sudo certbot renew --dry-run

# Verificar cron job para renovação automática
sudo crontab -l
```

## Configuração Atual do Nginx

O arquivo `nginx.conf` já está configurado corretamente para ambos os domínios:

```nginx
server {
    listen 80;
    server_name ncmanalyzerpro.com.br www.ncmanalyzerpro.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ncmanalyzerpro.com.br www.ncmanalyzerpro.com.br;
    # ... resto da configuração SSL
}
```

## Troubleshooting

### Problema: Certificado não inclui www
```bash
# Gerar novo certificado incluindo ambos os domínios
sudo certbot certonly --nginx -d ncmanalyzerpro.com.br -d www.ncmanalyzerpro.com.br
```

### Problema: Erro de DNS
- Verifique se ambos os domínios (com e sem www) estão apontando para o IP do servidor
- Aguarde a propagação DNS (pode levar até 48 horas)

### Problema: Nginx não reinicia
```bash
# Verificar erros de configuração
sudo nginx -t

# Ver logs de erro
sudo tail -f /var/log/nginx/error.log
```

## Notas Importantes

1. **Backup**: Sempre faça backup dos certificados antes de alterações
2. **Renovação**: Os certificados Let's Encrypt expiram em 90 dias
3. **Monitoramento**: Configure alertas para expiração de certificados
4. **Segurança**: Mantenha o servidor atualizado

## Comandos Úteis

```bash
# Verificar certificados instalados
sudo certbot certificates

# Renovar certificados
sudo certbot renew

# Verificar configuração SSL
ssl-checker ncmanalyzerpro.com.br

# Testar SSL online
# https://www.ssllabs.com/ssltest/
```