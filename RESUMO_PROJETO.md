# 📋 Resumo do Projeto ON.IPVC v3

Documento de referência rápida sobre a arquitetura e fluxo de dados do frontend e backend.

---

## 🏗️ Arquitetura Geral

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────┐
│   Frontend      │         │   Endpoints      │         │   Backend    │
│   (SvelteKit)   │ ──────> │   SvelteKit      │ ──────> │   (NestJS)   │
│                 │         │   (Proxy)         │         │              │
└─────────────────┘         └──────────────────┘         └──────┬───────┘
                                                                  │
                                                          ┌───────▼───────┐
                                                          │  SQL Server   │
                                                          │  (Prisma)     │
                                                          └──────────────┘
```

---

## 🎨 FRONTEND (SvelteKit)

### **Tecnologias:**
- **SvelteKit** - Framework
- **Svelte 5** - Com runes (`$state`, `$derived`)
- **TailwindCSS + Flowbite** - UI
- **Vite** - Build tool

### **Estrutura:**
```
src/
├── routes/
│   ├── (app)/(modules)/          # Páginas autenticadas
│   │   └── portal_noticias/      # Módulo de notícias
│   │       ├── criar/+page.svelte
│   │       ├── +page.svelte      # Listagem
│   │       └── editar/[id]/+page.svelte
│   └── (endpoints)/ep/            # Endpoints SvelteKit (proxy)
│       └── portal_noticias/
│           └── dados/+server.js
├── lib/
│   ├── components/               # Componentes reutilizáveis
│   ├── stores/                   # Svelte stores
│   ├── runes/                    # Svelte 5 runes
│   └── translations/             # i18n
└── static/                       # Ficheiros estáticos
```

### **Fluxo de Dados (Frontend):**

#### **1. Utilizador interage:**
- Preenche formulário
- Estado guardado em `$state({...})`

#### **2. Submete formulário:**
- Função `onHandleSubmit()` é chamada
- Dados extraídos do estado

#### **3. Upload de ficheiros (se houver):**
```javascript
POST /ep/portal_noticias/anexos
Body: FormData com ficheiros
```

#### **4. Cria/atualiza dados:**
```javascript
POST /ep/portal_noticias/dados
Body: FormData com dados da notícia
```

#### **5. Endpoint SvelteKit (Proxy):**
- Verifica permissões
- Adiciona token JWT
- Converte FormData → JSON
- Envia para backend NestJS

#### **6. Recebe resposta:**
- Processa JSON
- Atualiza UI
- Mostra feedback (toastr)

### **Padrões Frontend:**

**Estado Reativo:**
```javascript
let formField = $state({ titulo: '', descricao: '' });
let filtered = $derived(noticias.filter(...));
```

**Endpoints SvelteKit:**
- Atuam como proxy
- Adicionam JWT automaticamente
- Verificam permissões
- Escondem URL do backend

**Upload em 2 etapas:**
1. Upload ficheiros → `/ep/portal_noticias/anexos`
2. Criar notícia com metadados → `/ep/portal_noticias/dados`

---

## ⚙️ BACKEND (NestJS)

### **Tecnologias:**
- **NestJS** - Framework Node.js
- **Prisma** - ORM para SQL Server
- **SQL Server** - Base de dados
- **class-validator** - Validação de dados
- **Swagger** - Documentação API

### **Estrutura:**
```
src/
├── main.ts                        # Inicialização
├── app.module.ts                  # Módulo raiz
├── prisma/
│   └── prisma.service.ts          # Serviço Prisma (acesso à BD)
└── portal_noticias/
    ├── noticias/
    │   ├── noticias.controller.ts # Endpoints HTTP
    │   ├── noticias.service.ts     # Lógica + Queries Prisma
    │   └── noticias.module.ts      # Declaração do módulo
    ├── categoria/
    ├── tags/
    ├── anexos/
    └── dto/                        # Validação de dados
        ├── noticia.dto.ts
        └── ...
```

### **Fluxo de Dados (Backend):**

#### **1. Request HTTP chega:**
```
POST /portal_noticias/noticias
Body: JSON
```

#### **2. Controller recebe:**
```typescript
@Post()
async createNoticia(@Body() dto: NoticiaDto) {
  return this.noticiaService.createNoticias(dto);
}
```

#### **3. Validação DTO:**
- `class-validator` valida automaticamente
- Campos obrigatórios verificados
- Se inválido → 400 Bad Request

#### **4. Service processa:**
```typescript
async createNoticias(dto: NoticiaDto) {
  return this.prisma.$transaction(async (tx) => {
    return tx.pn_noticia.create({
      data: {
        titulo: dto.titulo,
        texto: dto.texto,
        pn_categoria: { connect: {...} },
        pn_anexos: { createMany: {...} },
        // ...
      }
    });
  });
}
```

#### **5. Prisma executa:**
- Converte TypeScript → SQL
- Executa queries no SQL Server
- Retorna dados

#### **6. Resposta:**
- Service retorna dados
- Controller retorna JSON
- Cliente recebe resposta

### **Padrões Backend:**

**Estrutura de Módulo:**
- **Controller** - Recebe requests HTTP
- **Service** - Lógica de negócio + Queries Prisma
- **DTO** - Validação de dados
- **Module** - Declara dependências

**Queries Prisma:**
```typescript
// Buscar todos
this.prisma.pn_noticia.findMany({...})

// Buscar um
this.prisma.pn_noticia.findUnique({...})

// Criar
this.prisma.pn_noticia.create({...})

// Atualizar
this.prisma.pn_noticia.update({...})

// Eliminar
this.prisma.pn_noticia.delete({...})
```

**Transações:**
```typescript
this.prisma.$transaction(async (tx) => {
  // Múltiplas operações
  // Se uma falhar, todas são revertidas
});
```

**Relações Prisma:**
```typescript
// Connect (ligar a existente)
pn_categoria: { connect: { id_categoria: ... } }

// CreateMany (criar novos relacionados)
pn_anexos: { createMany: { data: [...] } }

// DeleteMany + CreateMany (atualizar relações)
pn_rs_noticia: {
  deleteMany: {},
  createMany: { data: [...] }
}
```

---

## 🔄 Fluxo Completo: Criar Notícia

### **Frontend:**
1. Utilizador preenche formulário
2. Clica "Submeter"
3. `onHandleSubmit()` é chamado
4. Upload ficheiros → `/ep/portal_noticias/anexos`
5. Cria notícia → `/ep/portal_noticias/dados`

### **Endpoint SvelteKit:**
1. Verifica permissões
2. Converte FormData → JSON
3. Adiciona JWT token
4. Envia para backend

### **Backend:**
1. Controller recebe request
2. Valida DTO
3. Service processa dados
4. Prisma cria notícia + relações
5. Retorna notícia criada

### **Resposta:**
1. Backend → Endpoint SvelteKit
2. Endpoint → Componente
3. Componente atualiza UI
4. Mostra feedback ao utilizador

---

## 📁 Localização das Queries Prisma

**As queries Prisma estão nos Services:**

```
src/portal_noticias/
├── noticias/noticias.service.ts      ← Queries de notícias
├── categoria/categoria.service.ts    ← Queries de categorias
├── tags/tags.service.ts              ← Queries de tags
├── anexos/anexos.service.ts          ← Queries de anexos
└── redes_sociais/redes_sociais.service.ts ← Queries de redes sociais
```

**Exemplo:**
```typescript
// noticias.service.ts
constructor(private readonly prisma: PrismaService) {}

async getNoticias() {
  return this.prisma.pn_noticia.findMany({...});
}
```

---

## 🔑 Conceitos Importantes

### **Frontend:**
- **Runes** (`$state`, `$derived`) - Estado reativo
- **Endpoints SvelteKit** - Proxy com JWT e permissões
- **FormData** - Para ficheiros e dados complexos
- **Load Functions** - Carregam dados no servidor antes de renderizar

### **Backend:**
- **DTOs** - Validam dados de entrada automaticamente
- **Services** - Contêm lógica de negócio e queries
- **Controllers** - Recebem requests e delegam ao Service
- **Prisma** - ORM que converte TypeScript em SQL
- **Transações** - Garantem atomicidade (tudo ou nada)

---

## 📚 Arquivos Principais

### **Frontend:**
- `src/routes/(app)/(modules)/portal_noticias/criar/+page.svelte` - Formulário criar
- `src/routes/(endpoints)/ep/portal_noticias/dados/+server.js` - Endpoint proxy
- `src/routes/(app)/(modules)/portal_noticias/+page.svelte` - Listagem

### **Backend:**
- `src/portal_noticias/noticias/noticias.controller.ts` - Endpoints HTTP
- `src/portal_noticias/noticias/noticias.service.ts` - Lógica + Queries
- `src/portal_noticias/dto/noticia.dto.ts` - Validação
- `src/prisma/prisma.service.ts` - Serviço Prisma base

---

## 🛠️ Comandos Úteis

### **Frontend:**
```bash
cd ALUNOS_frontend_comunicacao
npm run dev          # Desenvolvimento
npm run build        # Build produção
```

### **Backend:**
```bash
cd ALUNOS_webservices_comunicacao
npm run dev          # Desenvolvimento
npm run build        # Build
npx prisma studio    # Interface visual da BD
```

### **Swagger (Backend):**
```
http://localhost:3000/api
```

---

## 📖 Documentação Detalhada

Para mais detalhes, consulte:
- **`FLUXO_DADOS_FRONTEND.md`** - Fluxo detalhado do frontend
- **`FLUXO_DADOS_BACKEND.md`** - Fluxo detalhado do backend
- **`GUIA_ESTUDO_PROJETO.md`** - Guia de estudo completo

---

## 🎯 Resumo Rápido

| Aspecto | Frontend | Backend |
|---------|----------|---------|
| **Framework** | SvelteKit | NestJS |
| **Estado** | Runes (`$state`) | Services |
| **Queries BD** | Não (via endpoints) | Prisma (nos Services) |
| **Validação** | No formulário | DTOs (automático) |
| **Proxy** | Endpoints SvelteKit | - |
| **Autenticação** | JWT no endpoint | Guards NestJS |
| **Ficheiros** | FormData | Multer + Prisma |

---

**Boa sorte com o desenvolvimento! 🚀**


