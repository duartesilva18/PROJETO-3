# 🧪 Exemplos de Teste - API Portal IPVC

## ✅ Endpoint: POST /portal_noticias/redessociais/portalipvc

### 📋 Campos Obrigatórios
- `titulo` (string): Título da notícia
- `conteudo` (string): Conteúdo/texto da notícia  
- `noticia_id` (string): UUID da notícia existente na base de dados

### 📋 Campos Opcionais
- `imageUrl` (string | null): ID do anexo de imagem (ou `null`)
- `tags` (string): Tags formatadas (ex: "#tag1 #tag2")

---

## 🔧 Exemplo 1: cURL Completo

```bash
curl -X 'POST' \
  'http://localhost:3000/portal_noticias/redessociais/portalipvc' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer SEU_TOKEN_AQUI' \
  -d '{
    "titulo": "Nova Notícia do Portal IPVC",
    "conteudo": "Este é o conteúdo completo da notícia que será publicada no Portal IPVC.",
    "imageUrl": null,
    "tags": "#ipvc #noticias #comunicacao",
    "noticia_id": "uuid-da-noticia-aqui"
  }'
```

---

## 🔧 Exemplo 2: Com Imagem

```bash
curl -X 'POST' \
  'http://localhost:3000/portal_noticias/redessociais/portalipvc' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer SEU_TOKEN_AQUI' \
  -d '{
    "titulo": "Notícia com Imagem",
    "conteudo": "Conteúdo da notícia com imagem anexada.",
    "imageUrl": "uuid-do-anexo-imagem",
    "tags": "#imagem #portal",
    "noticia_id": "uuid-da-noticia"
  }'
```

---

## 🔧 Exemplo 3: JavaScript/Fetch

```javascript
const response = await fetch('http://localhost:3000/portal_noticias/redessociais/portalipvc', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer SEU_TOKEN_AQUI'
  },
  body: JSON.stringify({
    titulo: 'Nova Notícia do Portal IPVC',
    conteudo: 'Este é o conteúdo completo da notícia.',
    imageUrl: null,
    tags: '#ipvc #noticias',
    noticia_id: 'uuid-da-noticia'
  })
});

const data = await response.json();
console.log(data);
```

---

## 🔧 Exemplo 4: Postman

### Configuração:
- **Method:** POST
- **URL:** `http://localhost:3000/portal_noticias/redessociais/portalipvc`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer SEU_TOKEN_AQUI`

### Body (raw JSON):
```json
{
  "titulo": "Nova Notícia do Portal IPVC",
  "conteudo": "Este é o conteúdo completo da notícia que será publicada no Portal IPVC.",
  "imageUrl": null,
  "tags": "#ipvc #noticias #comunicacao",
  "noticia_id": "uuid-da-noticia-aqui"
}
```

---

## 📝 Como Obter os Dados Necessários

### 1. Obter Token (Login)
```bash
curl -X 'POST' \
  'http://localhost:3000/auth/signIn' \
  -H 'Content-Type: application/json' \
  -d '{
    "id_utilizador": "dev",
    "password": "12345"
  }'
```

**Resposta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Listar Notícias para Obter ID
```bash
curl -X 'GET' \
  'http://localhost:3000/portal_noticias/noticias' \
  -H 'Authorization: Bearer SEU_TOKEN'
```

**Resposta:** Array de notícias com `id_noticia`

### 3. Listar Anexos para Obter ID de Imagem (Opcional)
```bash
curl -X 'GET' \
  'http://localhost:3000/portal_noticias/anexos' \
  -H 'Authorization: Bearer SEU_TOKEN'
```

**Resposta:** Array de anexos com `id_anexo` e `tipo`

---

## ✅ Resposta de Sucesso

```json
{
  "success": true,
  "message": "Notícia preparada para publicação no Portal IPVC (integração WordPress pendente)",
  "postId": null,
  "url": null
}
```

---

## ❌ Respostas de Erro

### 400 - Bad Request (Campos Faltando)
```json
{
  "message": "Campos obrigatórios: titulo, conteudo, noticia_id",
  "error": "Bad Request",
  "statusCode": 400
}
```

### 400 - Bad Request (ID da Notícia Inválido)
```json
{
  "message": "ID da notícia é obrigatório",
  "error": "Bad Request",
  "statusCode": 400
}
```

### 400 - Bad Request (Título Faltando)
```json
{
  "message": "Título da notícia é obrigatório",
  "error": "Bad Request",
  "statusCode": 400
}
```

### 400 - Bad Request (Conteúdo Faltando)
```json
{
  "message": "Conteúdo da notícia é obrigatório",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## 🔍 Teste Rápido - Verificar se Endpoint Está Funcionando

### Teste Mínimo (deve retornar erro 400 com mensagem clara):
```bash
curl -X 'POST' \
  'http://localhost:3000/portal_noticias/redessociais/portalipvc' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

**Resposta Esperada:**
```json
{
  "message": "Campos obrigatórios: titulo, conteudo, noticia_id",
  "error": "Bad Request",
  "statusCode": 400
}
```

✅ Se receberes esta resposta, significa que a validação está a funcionar corretamente!

---

## 📚 Notas Importantes

1. **Autenticação:** O endpoint requer autenticação JWT (Bearer token)
2. **UUID Válido:** O `noticia_id` deve ser um UUID válido de uma notícia existente
3. **Imagem:** Se forneceres `imageUrl`, deve ser um `id_anexo` válido de uma imagem
4. **Estado:** Após publicação bem-sucedida, o estado da notícia é atualizado para "Publicado"

---

## 🐛 Troubleshooting

### Erro 401 (Unauthorized)
- Verificar se o token está correto
- Verificar se o header `Authorization` está no formato: `Bearer {token}`

### Erro 500 (Internal Server Error)
- Verificar logs do servidor NestJS
- Verificar se a base de dados está acessível
- Verificar se o `noticia_id` é um UUID válido

### Erro de Conversão UUID
- Garantir que `noticia_id` é um UUID válido (formato: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
- Verificar se a notícia existe na base de dados

---

**Última atualização:** 2024-01-XX


