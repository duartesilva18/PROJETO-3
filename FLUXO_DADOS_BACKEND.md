# 🔄 Fluxo de Dados no Backend (NestJS)

Este documento explica como os dados fluem através do backend NestJS, desde a receção do request HTTP até à resposta.

---

## 📊 Visão Geral do Fluxo

```
HTTP Request → Controller → DTO Validation → Service → Prisma → SQL Server → Response
```

---

## 🏗️ Arquitetura do Backend

### **Estrutura de Camadas:**

1. **Controller** - Recebe requests HTTP e delega ao Service
2. **DTO (Data Transfer Object)** - Valida e formata dados
3. **Service** - Contém lógica de negócio
4. **Prisma Service** - ORM para acesso à base de dados
5. **SQL Server** - Base de dados

---

## 🔍 Fluxo Detalhado: Criar Notícia

Vamos seguir o exemplo completo de criar uma notícia:

### **1. Request HTTP chega ao Controller**

**Arquivo:** `src/portal_noticias/noticias/noticias.controller.ts`

```typescript
@Post()
async createNoticia(@Body() dto: NoticiaDto) {
  return this.noticiaService.createNoticias(dto);
}
```

**O que acontece:**
- NestJS recebe POST em `/portal_noticias/noticias`
- O decorator `@Body()` extrai o JSON do body
- O body é automaticamente validado contra o `NoticiaDto`
- Se válido, chama o método `createNoticias` do Service

---

### **2. Validação com DTO**

**Arquivo:** `src/portal_noticias/dto/noticia.dto.ts`

**O que acontece:**
- O NestJS usa `class-validator` para validar os dados
- Campos obrigatórios: `titulo`, `texto`
- Campos opcionais: `texto_facebook`, `texto_instagram`, `anexos`, `tags`, etc.
- Se algum campo obrigatório estiver vazio → erro 400 (Bad Request)
- Se validação passar → dados são passados ao Service

**Exemplo de validação:**
```typescript
@IsString()
@IsNotEmpty()
titulo: string;  // OBRIGATÓRIO

@IsString()
@IsOptional()
texto_facebook?: string;  // OPCIONAL
```

---

### **3. Service Processa a Lógica**

**Arquivo:** `src/portal_noticias/noticias/noticias.service.ts`

**Método:** `createNoticias(dto: NoticiaDto)`

**O que acontece:**

#### **3.1. Parsing de Dados**
```typescript
const parsedIdPedido = dto.id_pedido !== undefined && dto.id_pedido !== null
  ? Number(dto.id_pedido)
  : NaN;
```
- Converte `id_pedido` e `tipo` para números
- Verifica se são válidos com `Number.isFinite()`

#### **3.2. Transação Prisma**
```typescript
return this.prisma.$transaction(async (tx) => {
  return tx.pn_noticia.create({...});
});
```
- Usa transação para garantir atomicidade
- Se algo falhar, tudo é revertido

#### **3.3. Criação da Notícia**
```typescript
tx.pn_noticia.create({
  data: {
    titulo: dto.titulo,
    texto: dto.texto,
    // ... outros campos
    pn_categoria: {
      connect: { id_categoria: dto.id_categoria_FK }
    },
    pn_rs_noticia: {
      createMany: {
        data: (dto.redesSociais || []).map(...)
      }
    },
    pn_anexos: {
      createMany: {
        data: (dto.anexos || []).map(...)
      }
    },
    pn_noticia_Tag: {
      createMany: {
        data: (dto.tags || []).map(...)
      }
    }
  }
});
```

**O que acontece:**
- Cria registo na tabela `pn_noticia`
- **Connect** com categoria (relação existente)
- **CreateMany** para redes sociais, anexos e tags (cria novos registos relacionados)

---

### **4. Prisma Service Executa Query**

**Arquivo:** `src/prisma/prisma.service.ts`

**O que acontece:**
- Prisma converte o código TypeScript em SQL
- Executa queries no SQL Server
- Retorna os dados criados

**Exemplo de SQL gerado:**
```sql
BEGIN TRANSACTION;

INSERT INTO pn_noticia (titulo, texto, ...) VALUES (...);
INSERT INTO pn_rs_noticia (id_noticia_FK, id_rede_social_FK) VALUES (...);
INSERT INTO pn_anexos (id_noticia_FK, nome_ficheiro, ...) VALUES (...);
INSERT INTO pn_noticia_Tag (id_noticia_FK, id_tag) VALUES (...);

COMMIT;
```

---

### **5. Resposta Retornada**

**Fluxo de retorno:**
1. Prisma retorna objeto criado
2. Service retorna esse objeto
3. Controller retorna ao cliente HTTP
4. NestJS serializa para JSON
5. Cliente recebe resposta

**Exemplo de resposta:**
```json
{
  "id_noticia": "123",
  "titulo": "Título da notícia",
  "texto": "Texto da notícia",
  "data_criacao": "2025-01-15T10:30:00Z",
  ...
}
```

---

## 🔍 Fluxo Detalhado: Listar Notícias

### **1. Request GET**

**Controller:**
```typescript
@Get()
async getNoticias() {
  return this.noticiaService.getNoticias();
}
```

### **2. Service Busca Dados**

**Service:**
```typescript
async getNoticias() {
  return this.prisma.pn_noticia.findMany({
    select: {
      id_noticia: true,
      titulo: true,
      texto: true,
      // ... campos selecionados
      pn_categoria: true,  // Relação
      pn_anexos: true,     // Relação
      pn_noticia_Tag: true // Relação
    }
  });
}
```

**O que acontece:**
- `findMany()` busca todos os registos
- `select` especifica quais campos retornar
- Prisma faz JOIN automático com tabelas relacionadas
- Retorna array de notícias com dados relacionados

### **3. Prisma Executa Query**

```sql
SELECT 
  pn_noticia.id_noticia,
  pn_noticia.titulo,
  pn_noticia.texto,
  ...
FROM pn_noticia
LEFT JOIN pn_categoria ON ...
LEFT JOIN pn_anexos ON ...
LEFT JOIN pn_noticia_Tag ON ...
```

### **4. Resposta**

```json
[
  {
    "id_noticia": "1",
    "titulo": "Notícia 1",
    "pn_categoria": { "id_categoria": "1", "nome": "Geral" },
    "pn_anexos": [...],
    "pn_noticia_Tag": [...]
  },
  ...
]
```

---

## 🔍 Fluxo Detalhado: Atualizar Notícia

### **1. Request PUT**

**Controller:**
```typescript
@Put(':id')
async update(@Param('id') id: string, @Body() dto: NoticiaDto) {
  return this.noticiaService.updateNoticia(id, dto);
}
```

### **2. Service Valida e Atualiza**

**Service:**
```typescript
async updateNoticia(id: string, dto: NoticiaDto) {
  // 1. Verifica se existe
  const noticiaExist = await this.prisma.pn_noticia.findUnique({
    where: { id_noticia: id }
  });

  if (!noticiaExist) {
    return { message: 'Notícia não encontrada' };
  }

  // 2. Atualiza
  return await this.prisma.pn_noticia.update({
    where: { id_noticia: id },
    data: {
      titulo: dto.titulo,
      // ... outros campos
      pn_rs_noticia: {
        deleteMany: {},  // Remove todos
        createMany: {    // Cria novos
          data: (dto.redesSociais || []).map(...)
        }
      }
    }
  });
}
```

**O que acontece:**
- Verifica existência antes de atualizar
- Atualiza campos principais
- Para relações (redes sociais, anexos, tags):
  - **deleteMany** remove todos os registos relacionados
  - **createMany** cria novos com dados atualizados

---

## 🔍 Fluxo Detalhado: Upload de Anexos

### **1. Request POST com FormData**

**Controller:**
```typescript
@Post('anexos/upload')
async uploadAnexos(
  @UploadedFiles() files: Express.Multer.File[],
  @Body('codes') codes: string[]
) {
  return this.anexosService.upload_Anexo(files, codes);
}
```

### **2. Service Processa Ficheiros**

**Arquivo:** `src/portal_noticias/anexos/anexos.service.ts`

**O que acontece:**

#### **2.1. Validação de Tipos**
```typescript
const invalidFiles = files.filter(
  (file) => !this.allowedMimeTypes.has(file.mimetype)
);
```
- Verifica se são JPG, PNG, GIF ou MP4

#### **2.2. Guarda em Disco**
```typescript
files.forEach((file, index) => {
  const nomeDoArquivo = `${uuidv4()}${extensao}`;
  fs.writeFileSync(`uploads/portal_noticias/${nomeDoArquivo}`, file.buffer);
  
  uploadedFiles.push({
    nome_ficheiro: nomeDoArquivo,
    tipo: file.mimetype,
    nome_original_ficheiro: file.originalname,
    code_rede_social: codes[index] ?? null
  });
});
```

**O que acontece:**
- Gera UUID único para nome do ficheiro
- Guarda ficheiro físico em `uploads/portal_noticias/`
- Retorna metadados (não guarda na BD ainda)
- A guarda na BD acontece quando a notícia é criada

---

## 📋 Padrões Comuns no Backend

### **1. Estrutura de Módulo**

Cada módulo segue esta estrutura:

```
portal_noticias/
├── noticias/
│   ├── noticias.module.ts    # Declara módulo
│   ├── noticias.controller.ts # Endpoints HTTP
│   └── noticias.service.ts   # Lógica de negócio
├── categoria/
│   ├── categoria.module.ts
│   ├── categoria.controller.ts
│   └── categoria.service.ts
└── dto/
    ├── noticia.dto.ts         # Validação de dados
    ├── categoria.dto.ts
    └── ...
```

### **2. Injeção de Dependências**

**Module:**
```typescript
@Module({
  imports: [PrismaModule, AnexosModule],
  controllers: [NoticiasController],
  providers: [NoticiasService],
  exports: [NoticiasService]
})
```

**Service:**
```typescript
constructor(
  private readonly prisma: PrismaService,
  private readonly anexosService: AnexosService
) {}
```

- NestJS injeta automaticamente dependências
- `PrismaService` disponível em todos os services
- Outros services podem ser injetados se exportados

### **3. Tratamento de Erros**

**Padrão comum:**
```typescript
try {
  return await this.prisma.pn_noticia.create({...});
} catch (error) {
  console.error('Erro:', error);
  return { message: 'Não foi possível concluir o pedido' };
}
```

**Validação de existência:**
```typescript
const noticiaExist = await this.prisma.pn_noticia.findUnique({
  where: { id_noticia: id }
});

if (!noticiaExist) {
  return { message: 'Notícia não encontrada' };
}
```

### **4. Queries Prisma**

**Buscar todos:**
```typescript
findMany({ select: {...} })
```

**Buscar um:**
```typescript
findUnique({ where: { id: ... } })
```

**Criar:**
```typescript
create({ data: {...} })
```

**Atualizar:**
```typescript
update({ where: {...}, data: {...} })
```

**Eliminar:**
```typescript
delete({ where: {...} })
// OU (soft delete)
update({ where: {...}, data: { estado: 'eliminada' } })
```

**Relações:**
```typescript
// Connect (relação existente)
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

## 🔄 Fluxo Completo: Exemplo Prático

### **Cenário: Criar notícia com anexos, tags e redes sociais**

1. **Request chega:**
   ```
   POST /portal_noticias/noticias
   Body: { titulo, texto, anexos: [...], tags: [...], redesSociais: [...] }
   ```

2. **Controller recebe:**
   - Valida DTO automaticamente
   - Chama `noticiasService.createNoticias(dto)`

3. **Service processa:**
   - Inicia transação Prisma
   - Cria notícia principal
   - Cria registos relacionados (anexos, tags, redes sociais)
   - Commit transação

4. **Prisma executa:**
   - Múltiplas queries SQL em transação
   - Garante consistência

5. **Resposta:**
   - Retorna objeto criado com todos os relacionamentos
   - Frontend recebe dados completos

---

## 🎯 Pontos Importantes

### **1. Validação Automática**
- DTOs validam automaticamente com `class-validator`
- Erros de validação retornam 400 automaticamente

### **2. Transações**
- Operações complexas usam `$transaction`
- Garante atomicidade (tudo ou nada)

### **3. Relações Prisma**
- `connect` - liga a registo existente
- `createMany` - cria novos relacionados
- `deleteMany` + `createMany` - atualiza relações

### **4. Soft Delete**+
- Não se elimina fisicamente
- Atualiza `estado` para 'eliminada'

### **5. Ficheiros**
- Upload guarda em disco primeiro
- Metadados guardados na BD quando notícia é criada

---

## 📚 Arquivos de Referência

### **Controllers:**
- `src/portal_noticias/noticias/noticias.controller.ts`
- `src/portal_noticias/categoria/categoria.controller.ts`
- `src/portal_noticias/anexos/anexos.controller.ts`

### **Services:**
- `src/portal_noticias/noticias/noticias.service.ts`
- `src/portal_noticias/categoria/categoria.service.ts`
- `src/portal_noticias/anexos/anexos.service.ts`

### **DTOs:**
- `src/portal_noticias/dto/noticia.dto.ts`
- `src/portal_noticias/dto/categoria.dto.ts`
- `src/portal_noticias/dto/anexos.dto.ts`

### **Prisma:**
- `src/prisma/prisma.service.ts`
- `prisma/schema.prisma` (modelos de dados)

---

## 🔍 Como Estudar o Fluxo

1. **Escolha um endpoint** (ex: `POST /portal_noticias/noticias`)
2. **Encontre o Controller** correspondente
3. **Veja qual Service** é chamado
4. **Siga o método do Service** linha por linha
5. **Identifique queries Prisma** usadas
6. **Verifique o schema Prisma** para entender relações
7. **Teste com Postman/Swagger** para ver dados reais

---

**Boa sorte com os estudos! 🚀**


