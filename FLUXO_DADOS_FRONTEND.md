# 🔄 Fluxo de Dados no Frontend (SvelteKit)

Este documento explica como os dados fluem através do frontend SvelteKit, desde a interação do utilizador até à comunicação com o backend.

---

## 📊 Visão Geral do Fluxo

```
Utilizador → Componente Svelte → Formulário → Endpoint SvelteKit → Backend API → Resposta → Componente → UI
```

---

## 🏗️ Arquitetura do Frontend

### **Estrutura de Camadas:**

1. **Componente Svelte** - Interface do utilizador
2. **Estado (Runes/Stores)** - Gerencia estado reativo
3. **Endpoint SvelteKit** - Proxy entre frontend e backend
4. **Backend API** - API NestJS
5. **Resposta** - Dados retornados ao componente

---

## 🔍 Fluxo Detalhado: Criar Notícia

Vamos seguir o exemplo completo de criar uma notícia:

### **1. Utilizador Preenche Formulário**

**Arquivo:** `src/routes/(app)/(modules)/portal_noticias/criar/+page.svelte`

**Estado do Formulário:**
```javascript
let formField = $state({
  titulo: '',
  descricao: '',
  texto_rs: '',
  id_categoria_FK: '',
  texto_facebook: '',
  texto_instagram: '',
  // ... outros campos
});
```

**O que acontece:**
- Utilizador preenche campos no formulário
- Valores são guardados em `formField` (Svelte 5 rune `$state`)
- Estado é reativo - UI atualiza automaticamente

---

### **2. Utilizador Submete Formulário**

**Função:** `onHandleSubmit(event)`

**O que acontece:**

#### **2.1. Previne Comportamento Padrão**
```javascript
event.preventDefault();
```

#### **2.2. Extrai Dados do Formulário**
```javascript
const titulo = formField.titulo;
const descricao = formField.descricao;
const estado = 'Pendente';
const id_categoria_FK = formField.id_categoria_FK;
const redesSelecionadasNomes = getSelectedSocialNetworksNames();
const tags = selectedTags;
```

#### **2.3. Processa Anexos (Ficheiros)**
```javascript
// Gera código para cada ficheiro
anexos.forEach((file) => {
  file.codeRede = getCodeRedeSocial(file.redes);
  codes.push(getCodeRedeSocial(file.redes));
});

// Upload dos ficheiros primeiro
if (anexos.length > 0) {
  const formDataAnexos = new FormData();
  anexos.forEach((anexo) => {
    formDataAnexos.append('files', anexo);
  });
  formDataAnexos.append('codes', JSON.stringify(codes));
  
  anexosUploaded = await fetch('/ep/portal_noticias/anexos', {
    method: 'POST',
    body: formDataAnexos
  }).then(d => d.json());
}
```

**O que acontece:**
- Ficheiros são enviados primeiro para `/ep/portal_noticias/anexos`
- Backend guarda ficheiros em disco
- Retorna metadados dos ficheiros (nome, tipo, etc.)

---

### **3. Prepara Dados da Notícia**

**Cria FormData:**
```javascript
const formData = new FormData();
formData.append('texto', descricao);
formData.append('titulo', titulo);
formData.append('estado', estado);
formData.append('id_categoria_FK', id_categoria_FK);
formData.append('redesSociais', JSON.stringify(selectedSocialNetworks));
formData.append('tags', JSON.stringify(tags));
formData.append('anexos', JSON.stringify(anexosUploaded));
```

**O que acontece:**
- Cria `FormData` com todos os campos
- Arrays (redes sociais, tags, anexos) são convertidos para JSON strings
- Inclui metadados dos ficheiros já enviados

---

### **4. Envia para Endpoint SvelteKit**

**Request:**
```javascript
const noticiaResponse = await fetch('/ep/portal_noticias/dados', {
  method: 'POST',
  body: formData
});
```

**O que acontece:**
- Faz POST para endpoint SvelteKit (não diretamente para backend)
- Endpoint SvelteKit atua como proxy
- FormData é enviado como está

---

### **5. Endpoint SvelteKit Processa**

**Arquivo:** `src/routes/(endpoints)/ep/portal_noticias/dados/+server.js`

**O que acontece:**

#### **5.1. Verifica Permissões**
```javascript
const permissoes_acesso_rota = ["/portal_noticias"];
if (!checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)) {
  return json({ error: 401, message: "Não autorizado" }, { status: 401 });
}
```

#### **5.2. Converte FormData para Objeto**
```javascript
const formData = await request.formData();
const formDataObject = {};

for (const [key, value] of formData.entries()) {
  if (["tags", "redesSociais", "anexos"].includes(key)) {
    formDataObject[key] = value ? JSON.parse(String(value)) : [];
  } else {
    formDataObject[key] = value;
  }
}
```

**O que acontece:**
- Extrai dados do FormData
- Converte JSON strings de volta para arrays
- Valida campos obrigatórios

#### **5.3. Faz Request ao Backend**
```javascript
const response = await fetch(PUBLIC_API_URL + "portal_noticias/noticias", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + (locals?.info_utili.jwt_api),
    "Content-Type": "application/json",
  },
  body: JSON.stringify(formDataObject),
});
```

**O que acontece:**
- Adiciona token JWT do utilizador
- Converte objeto para JSON
- Envia para backend NestJS

---

### **6. Backend Processa e Retorna**

**Fluxo no Backend:**
- Controller recebe request
- Service processa dados
- Prisma guarda na base de dados
- Retorna notícia criada

**Ver:** `FLUXO_DADOS_BACKEND.md` para detalhes

---

### **7. Resposta Retorna ao Componente**

**No Endpoint SvelteKit:**
```javascript
const rawText = await response.text();
let parsed = rawText ? JSON.parse(rawText) : {};
return json(parsed);
```

**No Componente:**
```javascript
const noticiaResult = await noticiaResponse.json();
const noticiaId = noticiaResult?.id_noticia;
```

**O que acontece:**
- Endpoint SvelteKit retorna JSON
- Componente recebe resposta
- Extrai `id_noticia` criada

---

### **8. Processa Agendamentos (se houver)**

**Se agendamento ativado:**
```javascript
if (schedulingPayload.length > 0) {
  const scheduleResponse = await fetch('/ep/portal_noticias/redes/agendamentos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id_noticia: noticiaId,
      agendamentos: schedulingPayload
    })
  });
}
```

**O que acontece:**
- Se agendamento foi configurado, cria agendamentos
- Associa agendamentos à notícia criada

---

### **9. Feedback ao Utilizador**

**Sucesso:**
```javascript
toastr.success('Notícia criada com sucesso!', 'Sucesso', {
  timeOut: 3000,
  progressBar: true
});
goto('/portal_noticias');
```

**Erro:**
```javascript
catch (error) {
  toastr.error(error.message, 'Erro', {
    timeOut: 4000,
    progressBar: true
  });
}
```

---

## 🔍 Fluxo Detalhado: Listar Notícias

### **1. Página Carrega**

**Arquivo:** `src/routes/(app)/(modules)/portal_noticias/+page.svelte`

**onMount:**
```javascript
onMount(async () => {
  await loadNoticias();
});
```

### **2. Função loadNoticias**

**Busca Dados:**
```javascript
async function loadNoticias() {
  loadingData = true;
  
  const response = await fetch('/ep/portal_noticias/dados');
  const data = await response.json();
  
  noticiasData = data;
  originalNoticiasData = data;
  filteredNoticias = data;
  
  loadingData = false;
}
```

**O que acontece:**
- Faz GET para `/ep/portal_noticias/dados`
- Endpoint SvelteKit faz proxy para backend
- Recebe array de notícias
- Atualiza estado reativo

### **3. Endpoint SvelteKit**

**Arquivo:** `src/routes/(endpoints)/ep/portal_noticias/dados/+server.js`

```javascript
export async function GET({ fetch, locals }) {
  const subURL = PUBLIC_API_URL + "portal_noticias/noticias";
  
  const res = await fetch(subURL, {
    headers: {
      Authorization: "Bearer " + (locals?.info_utili.jwt_api),
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  return json(data);
}
```

**O que acontece:**
- Adiciona token JWT
- Faz GET ao backend
- Retorna dados

### **4. Backend Retorna Dados**

**Backend:**
- Service busca todas as notícias
- Prisma executa query
- Retorna array JSON

### **5. Componente Exibe**

**Template:**
```svelte
{#each filteredNoticias as noticia}
  <tr>
    <td>{noticia.titulo}</td>
    <td>{noticia.estado}</td>
    <!-- ... -->
  </tr>
{/each}
```

**O que acontece:**
- Svelte renderiza lista
- Estado reativo atualiza UI automaticamente

---

## 🔍 Fluxo Detalhado: Carregar Dados no Server

### **Load Functions (Server-Side)**

**Arquivo:** `src/routes/(app)/(modules)/portal_noticias/+page.server.js`

```javascript
export async function load({ cookies }) {
  setupTranslations();
  
  return {
    jwe: { data: "aaa" },
    jwt_cont: "bbb"
  };
}
```

**O que acontece:**
- Executa no servidor antes de renderizar
- Pode fazer requests ao backend
- Dados disponíveis no componente via `data`

**No Componente:**
```svelte
<script>
  let { data } = $props();
  // data contém o que foi retornado do load()
</script>
```

---

## 📋 Padrões Comuns no Frontend

### **1. Estado Reativo (Svelte 5 Runes)**

**$state:**
```javascript
let formField = $state({
  titulo: '',
  descricao: ''
});
```

**$derived:**
```javascript
let filteredNoticias = $derived(
  noticiasData.filter(n => n.titulo.includes(searchTerm))
);
```

**O que acontece:**
- `$state` cria estado reativo
- `$derived` calcula valores derivados
- UI atualiza automaticamente quando estado muda

### **2. Endpoints SvelteKit**

**Estrutura:**
```
routes/(endpoints)/ep/portal_noticias/dados/+server.js
```

**Padrão:**
```javascript
export async function GET({ fetch, locals }) {
  // Verifica permissões
  // Faz request ao backend
  // Retorna dados
}

export async function POST({ fetch, locals, request }) {
  // Recebe dados
  // Valida
  // Envia ao backend
  // Retorna resposta
}
```

**Por que usar endpoints SvelteKit?**
- Adiciona token JWT automaticamente
- Verifica permissões
- Centraliza lógica de comunicação
- Esconde URL do backend do cliente

### **3. Upload de Ficheiros**

**Padrão em duas etapas:**

**1. Upload dos ficheiros:**
```javascript
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);

const response = await fetch('/ep/portal_noticias/anexos', {
  method: 'POST',
  body: formData
});
```

**2. Incluir metadados na notícia:**
```javascript
const anexosUploaded = await response.json();

const formDataNoticia = new FormData();
formDataNoticia.append('anexos', JSON.stringify(anexosUploaded));
// ... outros campos
```

**O que acontece:**
- Ficheiros enviados primeiro
- Metadados guardados
- Metadados incluídos na criação da notícia

### **4. Tratamento de Erros**

**Try/Catch:**
```javascript
try {
  const response = await fetch('/ep/portal_noticias/dados', {...});
  
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.message ?? 'Erro desconhecido');
  }
  
  const result = await response.json();
  // Sucesso
} catch (error) {
  toastr.error(error.message, 'Erro');
}
```

### **5. Loading States**

**Estado de carregamento:**
```javascript
let loadingData = $state(true);

async function loadData() {
  loadingData = true;
  // ... fetch data
  loadingData = false;
}
```

**No Template:**
```svelte
{#if loadingData}
  <p>A carregar...</p>
{:else}
  <!-- Conteúdo -->
{/if}
```

---

## 🔄 Fluxo Completo: Exemplo Prático

### **Cenário: Criar notícia com anexos e tags**

1. **Utilizador preenche formulário:**
   - Título, descrição, categoria
   - Seleciona tags
   - Seleciona redes sociais
   - Adiciona ficheiros

2. **Clica em "Submeter":**
   - `onHandleSubmit()` é chamado
   - Previne submit padrão

3. **Upload de ficheiros:**
   - Cria FormData com ficheiros
   - POST para `/ep/portal_noticias/anexos`
   - Endpoint envia para backend
   - Backend guarda em disco
   - Retorna metadados

4. **Cria notícia:**
   - Cria FormData com dados
   - Inclui metadados dos ficheiros
   - POST para `/ep/portal_noticias/dados`
   - Endpoint converte para JSON
   - Envia para backend com JWT
   - Backend cria notícia + relações
   - Retorna notícia criada

5. **Feedback:**
   - Toast de sucesso
   - Redireciona para lista

---

## 🎯 Pontos Importantes

### **1. Endpoints SvelteKit são Proxies**
- Não fazem requests diretos ao backend
- Passam por endpoints SvelteKit
- Endpoints adicionam JWT e verificam permissões

### **2. Estado Reativo**
- Svelte 5 runes (`$state`, `$derived`)
- UI atualiza automaticamente
- Não precisa de `setState` manual

### **3. FormData vs JSON**
- Ficheiros → FormData
- Dados simples → JSON
- Endpoints convertem quando necessário

### **4. Load Functions**
- Executam no servidor
- Carregam dados antes de renderizar
- Disponíveis via `data` no componente

### **5. Tratamento de Erros**
- Sempre usar try/catch
- Verificar `response.ok`
- Mostrar feedback ao utilizador

---

## 📚 Arquivos de Referência

### **Componentes:**
- `src/routes/(app)/(modules)/portal_noticias/criar/+page.svelte`
- `src/routes/(app)/(modules)/portal_noticias/+page.svelte`
- `src/routes/(app)/(modules)/portal_noticias/editar/[id]/+page.svelte`

### **Endpoints:**
- `src/routes/(endpoints)/ep/portal_noticias/dados/+server.js`
- `src/routes/(endpoints)/ep/portal_noticias/anexos/+server.js`
- `src/routes/(endpoints)/ep/noticias/get/+server.js`

### **Load Functions:**
- `src/routes/(app)/(modules)/portal_noticias/+page.server.js`
- `src/routes/(app)/(modules)/+layout.server.js`

---

## 🔍 Como Estudar o Fluxo

1. **Escolha uma ação** (ex: "criar notícia")
2. **Encontre o componente** correspondente
3. **Veja a função de submit** ou ação
4. **Siga o fetch** até o endpoint SvelteKit
5. **Veja o endpoint** como processa
6. **Entenda o request** ao backend
7. **Veja como a resposta** é tratada
8. **Verifique o feedback** ao utilizador

---

## 🛠️ Ferramentas Úteis

### **DevTools do Browser:**
- **Network tab** - Ver todos os requests
- **Console** - Ver logs e erros
- **Application tab** - Ver cookies/localStorage

### **VS Code:**
- Svelte extension
- Ver tipos TypeScript
- Debugger

---

## 📝 Exercícios Práticos

### **Nível Iniciante:**
1. Adicionar um novo campo ao formulário
2. Adicionar validação antes de submeter
3. Adicionar loading state

### **Nível Intermediário:**
1. Criar um novo endpoint SvelteKit
2. Implementar filtros na listagem
3. Adicionar paginação

### **Nível Avançado:**
1. Implementar cache de dados
2. Adicionar optimistic updates
3. Implementar infinite scroll

---

## 🔗 Referências

- **Documentação SvelteKit:** https://kit.svelte.dev
- **Svelte 5 Runes:** https://svelte.dev/docs/svelte/runes
- **Fetch API:** https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

---

**Boa sorte com os estudos! 🚀**







