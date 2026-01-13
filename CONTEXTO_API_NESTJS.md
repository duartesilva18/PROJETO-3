# 📋 Contexto da API NestJS - Portal de Notícias

Este documento contém toda a informação necessária para integrar com a API NestJS do Portal de Notícias.

---

## 🔗 Configuração Base

### URL da API
- **Base URL**: `http://localhost:3000/`
- **Swagger Documentation**: `http://localhost:3000/api`
- **CORS**: Habilitado para todas as origens (`app.enableCors()`)

### Autenticação

A API usa **JWT Bearer Token** para autenticação.

**JWT_SECRET:** `key1234` (definido no ficheiro `.env` da API)

#### 1. Obter Token (Login)
```http
POST http://localhost:3000/auth/signIn
Content-Type: application/json

{
  "id_utilizador": "dev",
  "password": "12345"
}
```

**Resposta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2. Usar Token nas Requisições
Todas as requisições protegidas precisam do header:
```http
Authorization: Bearer {access_token}
```

---

## 📡 Endpoints Principais

### 🔐 Autenticação

#### `POST /auth/signIn`
Login e obtenção de token JWT.

**Body:**
```json
{
  "id_utilizador": "dev",
  "password": "12345"
}
```

**Resposta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 📰 Notícias

**Base Path:** `/portal_noticias/noticias`

#### `GET /portal_noticias/noticias`
Lista todas as notícias.

**Headers:**
```
Authorization: Bearer {token}
```

**Resposta:** Array de notícias

---

#### `GET /portal_noticias/noticias/v2`
Lista notícias com filtros.

**Query Parameters:**
- `titulo` (string, opcional): Filtrar por título
- `categoria` (string, opcional): Filtrar por categoria
- `estado` (string, opcional): Filtrar por estado
- `data` (string, opcional): Filtrar por data

**Exemplo:**
```
GET /portal_noticias/noticias/v2?titulo=teste&estado=Publicado
```

---

#### `GET /portal_noticias/noticias/portal-ipvc/list`
**Lista apenas notícias selecionadas para Portal IPVC**

Este endpoint retorna todas as notícias que têm a rede social "Portal IPVC" selecionada. Ideal para integração com WordPress.

**Query Parameters:**
- `apenasPublicadas` (boolean, opcional): Se `true`, retorna apenas notícias com estado "Publicado". Padrão: `false`

**Exemplos:**
```
GET /portal_noticias/noticias/portal-ipvc/list
GET /portal_noticias/noticias/portal-ipvc/list?apenasPublicadas=true
```

**Resposta:**
```json
[
  {
    "id_noticia": "uuid",
    "titulo": "Título da notícia",
    "texto": "Texto completo",
    "texto_portalipvc": "Texto específico para Portal IPVC",
    "data_criacao": "2024-01-01T10:00:00Z",
    "estado": "Publicado",
    "pn_categoria": {
      "id_categoria": "uuid",
      "nome": "Categoria",
      "descricao": "Descrição da categoria"
    },
    "pn_anexos": [
      {
        "id_anexo": "uuid",
        "nome_ficheiro": "imagem.jpg",
        "tipo": "image/jpeg"
      }
    ],
    "pn_noticia_Tag": [
      {
        "pn_tag": {
          "id_tag": "uuid",
          "nome": "tag1"
        }
      }
    ]
  }
]
```

**Notas:**
- Retorna apenas notícias que têm "Portal IPVC" selecionado na relação `pn_rs_noticia`
- Inclui apenas anexos do tipo imagem (`image/*`)
- Ordenado por data de criação (mais recentes primeiro)
- Ideal para uso no WordPress para listar notícias do Portal IPVC

---

#### `GET /portal_noticias/noticias/:id`
Obtém uma notícia específica por ID.

**Parâmetros:**
- `id` (string): ID da notícia

---

#### `POST /portal_noticias/noticias`
Cria uma nova notícia.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body (NoticiaDto):**
```json
{
  "titulo": "Título da notícia",
  "texto": "Texto completo da notícia",
  "texto_facebook": "Texto específico para Facebook (opcional)",
  "texto_instagram": "Texto específico para Instagram (opcional)",
  "texto_linkedin": "Texto específico para LinkedIn (opcional)",
  "texto_twitter": "Texto específico para Twitter (opcional)",
  "texto_tiktok": "Texto específico para TikTok (opcional)",
  "texto_portalipvc": "Texto específico para Portal IPVC (opcional)",
  "estado": "Pendente" | "Publicado",
  "id_categoria_FK": "uuid-da-categoria",
  "anexos": [],
  "tags": [
    {
      "nome": "tag1"
    }
  ],
  "redesSociais": [],
  "id_pedido": 1,
  "emails": "email1@ex.com,email2@ex.com",
  "tipo": 0 | 1 | 2,
  "noticia_radio_jornal": []
}
```

**Campos importantes:**
- `texto_portalipvc`: Texto específico para publicação no Portal IPVC (WordPress)
- `tipo`: 0 = só media, 1 = só rede social, 2 = misto
- `estado`: "Pendente" ou "Publicado"

---

#### `PUT /portal_noticias/noticias/:id`
Atualiza uma notícia existente.

**Parâmetros:**
- `id` (string): ID da notícia

**Body:** Mesmo formato do POST

---

#### `PUT /portal_noticias/noticias/:id/status`
Atualiza apenas o estado de uma notícia.

**Body:**
```json
{
  "estado": "Publicado"
}
```

---

#### `DELETE /portal_noticias/noticias/:id`
Remove uma notícia.

---

### 📎 Anexos (Ficheiros)

**Base Path:** `/portal_noticias/anexos`

#### `GET /portal_noticias/anexos`
Lista todos os anexos.

---

#### `GET /portal_noticias/anexos/:id_anexo`
Obtém um anexo específico (retorna o ficheiro).

**Parâmetros:**
- `id_anexo` (string): ID do anexo

**Resposta:** Stream do ficheiro

---

#### `POST /portal_noticias/anexos/upload`
Faz upload de ficheiros.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body (FormData):**
- `files`: Array de ficheiros
- `codes`: JSON string com códigos das redes sociais

**Exemplo:**
```javascript
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);
formData.append('codes', JSON.stringify(['1', '0', '1', '0', '0', '0']));
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id_anexo": "uuid",
      "nome_ficheiro": "nome.jpg",
      "tipo": "image/jpeg"
    }
  ]
}
```

---

#### `PUT /portal_noticias/anexos/:id`
Atualiza um anexo.

---

#### `DELETE /portal_noticias/anexos/:id`
Remove um anexo.

---

### 🏷️ Categorias

**Base Path:** `/portal_noticias/categorias`

#### `GET /portal_noticias/categorias`
Lista todas as categorias.

---

#### `GET /portal_noticias/categorias/:id`
Obtém uma categoria específica.

---

#### `POST /portal_noticias/categorias`
Cria uma nova categoria.

**Body:**
```json
{
  "nome": "Nome da categoria"
}
```

---

#### `PUT /portal_noticias/categorias/:id`
Atualiza uma categoria.

---

#### `DELETE /portal_noticias/categorias/:id`
Remove uma categoria.

---

### 🏷️ Tags

**Base Path:** `/portal_noticias/tags`

#### `GET /portal_noticias/tags`
Lista todas as tags.

---

#### `GET /portal_noticias/tags/:id`
Obtém uma tag específica.

---

#### `POST /portal_noticias/tags`
Cria uma nova tag.

**Body:**
```json
{
  "nome": "nome-da-tag"
}
```

---

#### `PUT /portal_noticias/tags/:id`
Atualiza uma tag.

---

#### `PUT /portal_noticias/tags/:id/activate`
Ativa uma tag.

---

#### `DELETE /portal_noticias/tags/:id`
Remove uma tag.

---

### 📱 Redes Sociais

**Base Path:** `/portal_noticias/redessociais`

#### `GET /portal_noticias/redessociais`
Lista todas as redes sociais configuradas.

**Resposta:**
```json
[
  {
    "id_rede_social": "uuid",
    "nome": "Facebook"
  },
  {
    "id_rede_social": "uuid",
    "nome": "Instagram"
  },
  {
    "id_rede_social": "uuid",
    "nome": "Portal IPVC"
  }
]
```

---

#### `POST /portal_noticias/redessociais/publicar/:id`
Publica automaticamente uma notícia nas redes selecionadas.

**Parâmetros:**
- `id` (string): ID da notícia

---

#### `POST /portal_noticias/redessociais/portalipvc`
**Publica no Portal IPVC (WordPress)**

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "titulo": "Título da notícia",
  "conteudo": "Conteúdo completo da notícia (pode incluir texto_portalipvc + tags)",
  "imageUrl": "uuid-do-anexo-imagem" | null,
  "tags": "#tag1 #tag2",
  "noticia_id": "uuid-da-noticia"
}
```

**Importante:**
- `imageUrl`: Deve ser o `id_anexo` de uma imagem (apenas 1 imagem permitida)
- Se `imageUrl` for `null`, a publicação será feita sem imagem
- O Portal IPVC requer exatamente 1 imagem ou nenhuma

**Resposta:**
```json
{
  "success": true,
  "message": "Notícia publicada no Portal IPVC",
  "postId": 123,
  "url": "https://portal.ipvc.pt/noticia/123"
}
```

---

#### `POST /portal_noticias/redessociais/facebook`
Publica no Facebook.

**Body:**
```json
{
  "message": "Mensagem do post",
  "mediaUrls": ["uuid-anexo1", "uuid-anexo2"],
  "noticia_id": "uuid-da-noticia"
}
```

---

#### `POST /portal_noticias/redessociais/twitter`
Publica no Twitter.

**Body:**
```json
{
  "message": "Mensagem do tweet",
  "mediaUrls": ["uuid-anexo1"],
  "noticia_id": "uuid-da-noticia"
}
```

---

#### `POST /portal_noticias/redessociais/instagram`
Publica no Instagram.

**Body:**
```json
{
  "mediaUrls": ["uuid-anexo1"],
  "caption": "Legenda do post",
  "noticia_id": "uuid-da-noticia"
}
```

---

#### `POST /portal_noticias/redessociais/linkedin`
Publica no LinkedIn.

**Body:**
```json
{
  "imageUrl": "uuid-anexo-imagem",
  "caption": "Texto do post",
  "noticia_id": "uuid-da-noticia"
}
```

---

### 📅 Agendamentos

**Base Path:** `/portal_noticias/redessociais/agendamentos`

#### `GET /portal_noticias/redessociais/agendamentos`
Lista todos os agendamentos.

**Resposta:**
```json
[
  {
    "id_agendamento": "uuid",
    "id_noticia": "uuid",
    "titulo": "Título da notícia",
    "categoria": "Nome da categoria",
    "id_rede_social": "uuid",
    "rede_nome": "Facebook",
    "horario_agendado": "2024-01-01T10:00:00Z",
    "fuso_horario": "Europe/Lisbon",
    "status": "Pendente",
    "data_criacao": "2024-01-01T09:00:00Z"
  }
]
```

---

#### `GET /portal_noticias/redessociais/agendamentos/:id_noticia`
Lista agendamentos de uma notícia específica.

---

#### `POST /portal_noticias/redessociais/agendamentos`
Cria agendamentos para uma notícia.

**Body:**
```json
{
  "id_noticia": "uuid",
  "agendamentos": [
    {
      "id_rede_social": "uuid",
      "horario_agendado": "2024-01-01T10:00:00Z",
      "fuso_horario": "Europe/Lisbon",
      "status": "Pendente"
    }
  ]
}
```

---

#### `PUT /portal_noticias/redessociais/agendamentos/:id_agendamento`
Atualiza um agendamento.

**Body:**
```json
{
  "horario_agendado": "2024-01-01T11:00:00Z",
  "fuso_horario": "UTC",
  "status": "Concluído"
}
```

---

#### `DELETE /portal_noticias/redessociais/agendamentos/:id_agendamento`
Remove um agendamento.

---

#### `DELETE /portal_noticias/redessociais/agendamentos/:id_noticia/:id_rede_social`
Remove agendamento de uma rede específica.

---

## 🔧 Estrutura de Dados

### Notícia Completa
```typescript
{
  id_noticia: string;
  titulo: string;
  texto: string;
  texto_facebook?: string;
  texto_instagram?: string;
  texto_linkedin?: string;
  texto_twitter?: string;
  texto_tiktok?: string;
  texto_portalipvc?: string;  // IMPORTANTE: Para Portal IPVC
  estado: "Pendente" | "Publicado";
  id_categoria_FK?: string;
  data_criacao: Date;
  pn_anexos?: Array<{
    id_anexo: string;
    nome_ficheiro: string;
    tipo: string;
    code_rede_social: string;
  }>;
  pn_rs_noticia?: Array<{
    pn_redes_sociais: {
      nome: string;
    };
  }>;
}
```

### Códigos de Redes Sociais (code_rede_social)
String de 6 caracteres, cada posição representa uma rede:
- Posição 0: Facebook (1 = selecionado, 0 = não selecionado)
- Posição 1: Instagram
- Posição 2: Twitter
- Posição 3: LinkedIn
- Posição 4: TikTok
- Posição 5: Portal IPVC

**Exemplo:** `"101000"` = Facebook e Twitter selecionados

---

## 📝 Exemplos de Uso

### Exemplo 1: Publicar no Portal IPVC

```javascript
// 1. Obter token
const loginResponse = await fetch('http://localhost:3000/auth/signIn', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id_utilizador: 'dev',
    password: '12345'
  })
});
const { access_token } = await loginResponse.json();

// 2. Publicar no Portal IPVC
const response = await fetch('http://localhost:3000/portal_noticias/redessociais/portalipvc', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    titulo: 'Título da notícia',
    conteudo: 'Conteúdo completo da notícia #tag1 #tag2',
    imageUrl: 'uuid-do-anexo-imagem', // ou null
    tags: '#tag1 #tag2',
    noticia_id: 'uuid-da-noticia'
  })
});

const result = await response.json();
console.log(result);
```

### Exemplo 2: Criar Notícia com Portal IPVC

```javascript
const noticia = {
  titulo: 'Nova Notícia',
  texto: 'Texto completo da notícia',
  texto_portalipvc: 'Texto específico para Portal IPVC',
  estado: 'Pendente',
  id_categoria_FK: 'uuid-categoria',
  tags: [{ nome: 'tag1' }],
  redesSociais: [{ id_rede_social: 'uuid-portal-ipvc' }],
  anexos: ['uuid-anexo-imagem']
};

const response = await fetch('http://localhost:3000/portal_noticias/noticias', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(noticia)
});
```

---

## ⚠️ Notas Importantes

1. **Portal IPVC**: Requer exatamente 1 imagem ou nenhuma. Não aceita múltiplas imagens.

2. **Autenticação**: Todas as requisições (exceto login) precisam do header `Authorization: Bearer {token}`.

3. **CORS**: Já está configurado para aceitar requisições de qualquer origem.

4. **IDs**: Todos os IDs são UUIDs (strings).

5. **Estados**: As notícias podem ter estado "Pendente" ou "Publicado".

6. **Swagger**: Documentação completa disponível em `http://localhost:3000/api`.

---

## 🔍 Troubleshooting

### Erro 401 (Unauthorized)
- Verificar se o token está válido
- Verificar se o header `Authorization` está correto: `Bearer {token}`

### Erro 404 (Not Found)
- Verificar se a URL está correta
- Verificar se o ID existe na base de dados

### Erro CORS
- A API já tem CORS habilitado, mas verificar se o frontend está a fazer requisições corretas

### Portal IPVC - Erro de Imagem
- Verificar se há exatamente 1 imagem ou nenhuma
- Verificar se o `imageUrl` é um `id_anexo` válido de uma imagem

---

## 📚 Recursos Adicionais

- **Swagger UI**: `http://localhost:3000/api` - Documentação interativa
- **Base de Dados**: SQL Server
- **ORM**: Prisma
- **Framework**: NestJS

---

**Última atualização:** 2024-01-XX
**Versão da API:** 1.0

