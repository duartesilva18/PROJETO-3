# 📚 Guia de Estudo do Projeto ON.IPVC v3 - Backend

## 🎯 Foco: Fluxo de Dados no Backend

Este guia foca especificamente no **fluxo de dados no backend NestJS**, desde a receção de requests HTTP até à resposta.

> **Nota:** Para o fluxo de dados no frontend, consulte `FLUXO_DADOS_FRONTEND.md`

---

## 🏗️ Arquitetura do Backend

### **Estrutura de Camadas:**

```
HTTP Request
    ↓
Controller (recebe request, valida DTO)
    ↓
Service (lógica de negócio)
    ↓
Prisma Service (ORM)
    ↓
SQL Server (Base de Dados)
    ↓
Response (JSON)
```

---

## 📋 Estrutura do Projeto Backend

### **Tecnologias Principais:**
- **NestJS** (framework Node.js)
- **Prisma** (ORM para SQL Server)
- **SQL Server** (banco de dados)
- **Swagger** (documentação API)
- **class-validator** (validação de dados)

### **Estrutura de Pastas:**
```
src/
├── main.ts                    # Inicialização da aplicação
├── app.module.ts              # Módulo raiz
├── prisma/
│   ├── prisma.service.ts      # Serviço Prisma (acesso à BD)
│   └── prisma.module.ts
├── portal_noticias/           # Módulo de notícias
│   ├── noticias/
│   │   ├── noticias.module.ts    # Declaração do módulo
│   │   ├── noticias.controller.ts # Endpoints HTTP
│   │   └── noticias.service.ts    # Lógica de negócio
│   ├── categoria/
│   ├── tags/
│   ├── anexos/
│   └── dto/                   # Data Transfer Objects (validação)
│       ├── noticia.dto.ts
│       ├── categoria.dto.ts
│       └── ...
└── funcoesbase/              # Funções base/comuns
```

---

## 🔄 Fluxo de Dados: Visão Geral

### **1. Request HTTP → Controller**

O NestJS recebe o request HTTP e roteia para o Controller apropriado baseado na URL.

**Exemplo:**
```
POST /portal_noticias/noticias
→ NoticiasController.createNoticia()
```

### **2. Controller → DTO Validation**

O Controller recebe os dados do body e valida automaticamente contra o DTO.

**Exemplo:**
```typescript
@Post()
async createNoticia(@Body() dto: NoticiaDto) {
  // DTO é validado automaticamente
  // Se inválido → retorna 400 Bad Request
  // Se válido → continua
}
```

### **3. Controller → Service**

O Controller delega a lógica de negócio ao Service.

**Exemplo:**
```typescript
return this.noticiaService.createNoticias(dto);
```

### **4. Service → Prisma**

O Service usa o Prisma Service para aceder à base de dados.

**Exemplo:**
```typescript
return this.prisma.pn_noticia.create({
  data: { ... }
});
```

### **5. Prisma → SQL Server**

O Prisma converte o código TypeScript em SQL e executa na base de dados.

### **6. Resposta**

Os dados retornam pelo mesmo caminho: Prisma → Service → Controller → HTTP Response

---

## 📖 Documentação Detalhada

Para entender o fluxo de dados em detalhe, consulte:

**📄 `FLUXO_DADOS_BACKEND.md`** - Documentação completa com:
- Fluxos detalhados passo a passo
- Exemplos práticos (criar, listar, atualizar)
- Padrões comuns
- Estrutura de módulos
- Queries Prisma
- Tratamento de erros

---

## 🎓 Como Estudar o Backend

### **Método Recomendado:**

1. **Comece pelo Controller**
   - Veja quais endpoints existem
   - Entenda o que cada um faz

2. **Siga para o Service**
   - Veja a lógica de negócio
   - Entenda como os dados são processados

3. **Estude o Prisma**
   - Veja as queries usadas
   - Entenda as relações entre tabelas

4. **Verifique o DTO**
   - Veja quais campos são obrigatórios
   - Entenda as validações

5. **Teste com Swagger/Postman**
   - Execute requests reais
   - Veja as respostas

### **Arquivos para Estudar (por ordem):**

#### **1. Entender a Estrutura:**
- `src/main.ts` - Como a aplicação inicia
- `src/app.module.ts` - Módulos registados
- `src/prisma/prisma.service.ts` - Acesso à BD

#### **2. Módulo Portal de Notícias:**
- `src/portal_noticias/dto/noticia.dto.ts` - Validação de dados
- `src/portal_noticias/noticias/noticias.controller.ts` - Endpoints
- `src/portal_noticias/noticias/noticias.service.ts` - Lógica
- `src/portal_noticias/noticias/noticias.module.ts` - Configuração

#### **3. Outros Módulos (padrão similar):**
- `src/portal_noticias/categoria/`
- `src/portal_noticias/anexos/`
- `src/portal_noticias/tags/`

---

## 🔍 Exemplos Práticos

### **Exemplo 1: Criar Notícia**

**Fluxo completo:**
1. Request: `POST /portal_noticias/noticias` com JSON body
2. Controller: `createNoticia(@Body() dto: NoticiaDto)`
3. Validação: DTO valida `titulo` e `texto` (obrigatórios)
4. Service: `createNoticias(dto)` processa dados
5. Prisma: Cria notícia + relações (categoria, tags, anexos, redes sociais)
6. SQL Server: Executa INSERTs
7. Response: Retorna notícia criada

**Ver detalhes em:** `FLUXO_DADOS_BACKEND.md` (secção "Fluxo Detalhado: Criar Notícia")

### **Exemplo 2: Listar Notícias**

**Fluxo completo:**
1. Request: `GET /portal_noticias/noticias`
2. Controller: `getNoticias()`
3. Service: `getNoticias()` busca todas
4. Prisma: `findMany()` com `select` e `include`
5. SQL Server: Executa SELECT com JOINs
6. Response: Array de notícias com relações

**Ver detalhes em:** `FLUXO_DADOS_BACKEND.md` (secção "Fluxo Detalhado: Listar Notícias")

---

## 📚 Conceitos Importantes

### **1. DTOs (Data Transfer Objects)**
- Validam dados de entrada
- Usam decorators `@IsString()`, `@IsNotEmpty()`, etc.
- Erros de validação retornam 400 automaticamente

### **2. Services**
- Contêm lógica de negócio
- Não lidam diretamente com HTTP
- Usam Prisma para aceder à BD

### **3. Controllers**
- Recebem requests HTTP
- Delegam ao Service
- Retornam respostas HTTP

### **4. Prisma**
- ORM (Object-Relational Mapping)
- Converte TypeScript em SQL
- Gerencia relações entre tabelas

### **5. Transações**
- Operações complexas usam `$transaction`
- Garante atomicidade (tudo ou nada)

---

## 🛠️ Ferramentas Úteis

### **Swagger UI**
- Documentação interativa da API
- Testar endpoints diretamente
- Aceder em: `http://localhost:3000/api`

### **Prisma Studio**
- Interface visual para a base de dados
- Ver e editar dados
- Comando: `npx prisma studio`

### **Postman/Insomnia**
- Testar endpoints manualmente
- Ver requests/responses completos

---

## 📝 Exercícios Práticos

### **Nível Iniciante:**
1. Adicionar um novo campo ao DTO de notícia
2. Criar um novo endpoint GET simples
3. Adicionar validação a um campo existente

### **Nível Intermediário:**
1. Criar um novo módulo completo (controller + service + DTO)
2. Implementar filtros em uma listagem
3. Adicionar tratamento de erros personalizado

### **Nível Avançado:**
1. Otimizar queries Prisma
2. Implementar paginação
3. Adicionar cache

---

## 🔗 Referências

- **Documentação NestJS:** https://docs.nestjs.com
- **Documentação Prisma:** https://www.prisma.io/docs
- **Documentação class-validator:** https://github.com/typestack/class-validator

---

## 📄 Documentos Relacionados

- **`FLUXO_DADOS_BACKEND.md`** - Fluxo detalhado passo a passo
- **`FLUXO_DADOS_FRONTEND.md`** - Fluxo de dados no frontend
- **`ALUNOS_webservices_comunicacao/README.md`** - README do backend

---

**Boa sorte com os estudos! 🚀**

