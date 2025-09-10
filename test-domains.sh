#!/bin/bash

# Script para testar ambos os domínios após configuração SSL

echo "=== Testando Domínios NCM Analyzer Pro ==="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para testar um domínio
test_domain() {
    local domain=$1
    echo "Testando: $domain"
    
    # Testar HTTP (deve redirecionar para HTTPS)
    echo -n "  HTTP -> HTTPS redirect: "
    http_status=$(curl -s -o /dev/null -w "%{http_code}" "http://$domain")
    if [ "$http_status" = "301" ] || [ "$http_status" = "302" ]; then
        echo -e "${GREEN}✓ OK ($http_status)${NC}"
    else
        echo -e "${RED}✗ FALHOU ($http_status)${NC}"
    fi
    
    # Testar HTTPS
    echo -n "  HTTPS access: "
    https_status=$(curl -s -o /dev/null -w "%{http_code}" "https://$domain")
    if [ "$https_status" = "200" ]; then
        echo -e "${GREEN}✓ OK ($https_status)${NC}"
    else
        echo -e "${RED}✗ FALHOU ($https_status)${NC}"
    fi
    
    # Testar certificado SSL
    echo -n "  SSL Certificate: "
    ssl_check=$(echo | openssl s_client -servername $domain -connect $domain:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Válido${NC}"
        # Mostrar data de expiração
        expiry=$(echo "$ssl_check" | grep "notAfter" | cut -d= -f2)
        echo "    Expira em: $expiry"
    else
        echo -e "${RED}✗ Inválido${NC}"
    fi
    
    # Testar tempo de resposta
    echo -n "  Response time: "
    response_time=$(curl -s -o /dev/null -w "%{time_total}" "https://$domain")
    echo "${response_time}s"
    
    echo ""
}

# Testar ambos os domínios
test_domain "ncmanalyzerpro.com.br"
test_domain "www.ncmanalyzerpro.com.br"

# Verificar se ambos os domínios retornam o mesmo conteúdo
echo "=== Verificando Consistência de Conteúdo ==="
content1=$(curl -s "https://ncmanalyzerpro.com.br" | head -n 10)
content2=$(curl -s "https://www.ncmanalyzerpro.com.br" | head -n 10)

if [ "$content1" = "$content2" ]; then
    echo -e "${GREEN}✓ Ambos os domínios retornam o mesmo conteúdo${NC}"
else
    echo -e "${YELLOW}⚠ Os domínios retornam conteúdo diferente${NC}"
fi

echo ""
echo "=== Verificações de DNS ==="

# Verificar DNS
echo "DNS para ncmanalyzerpro.com.br:"
nslookup ncmanalyzerpro.com.br

echo ""
echo "DNS para www.ncmanalyzerpro.com.br:"
nslookup www.ncmanalyzerpro.com.br

echo ""
echo "=== Teste Completo ==="
echo -e "${GREEN}Teste finalizado!${NC}"
echo "Verifique os resultados acima para garantir que ambos os domínios estão funcionando corretamente."