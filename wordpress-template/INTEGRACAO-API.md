# 🔗 Integração WordPress com API NestJS (SQL Server)

## ✅ Solução: Usar a API Existente

Em vez de tentar ligar o WordPress diretamente ao SQL Server, vamos usar a **API NestJS que já tens**!

### Vantagens:
- ✅ Não precisa de instalar WordPress com SQL Server
- ✅ Usa a mesma base de dados através da API
- ✅ Mantém a arquitetura existente
- ✅ Mais simples de configurar

---

## 📋 Passo a Passo

### 1. Instalar WordPress Normalmente

1. Instala o WordPress normalmente com **MySQL** (como explicado nos guias anteriores)
2. Não precisas de criar uma base de dados separada para as notícias
3. O WordPress só vai usar MySQL para as suas próprias tabelas

### 2. Configurar URL da API

1. No WordPress Admin, vai a **Definições → Lista de Notícias**
2. Cola a URL da tua API NestJS:
   - **Local:** `http://localhost:3000`
   - **Produção:** `https://api.seudominio.com`
3. Clica em **Guardar alterações**

### 3. Copiar Ficheiros

Copia estes ficheiros para a pasta do tema:
- ✅ `page-lista-noticias-api.php` (em vez do outro)
- ✅ `style-lista-noticias.css`
- ✅ Adiciona o código de `functions-api-integration.php` ao `functions.php`

### 4. Criar a Página

1. **Páginas → Adicionar Nova**
2. Nome: "Lista de Notícias"
3. Template: **"Lista de Notícias (API)"**
4. Publicar

---

## 🔧 Como Funciona

1. A página WordPress faz chamadas HTTP à tua API NestJS
2. A API retorna as notícias da base de dados SQL Server
3. A página exibe as notícias formatadas

### Endpoints Usados:
- `GET /portal_noticias/noticias` - Lista todas as notícias
- `GET /portal_noticias/noticias/v2?titulo=...` - Notícias com filtros
- `GET /portal_noticias/radio_jornal` - Lista rádios/jornais

---

## ⚙️ Configuração da API

### Verificar se a API está acessível:

```bash
# Testar localmente
curl http://localhost:3000/portal_noticias/noticias

# Deve retornar JSON com as notícias
```

### Se a API estiver noutro servidor:

1. Verifica se o CORS está configurado no NestJS
2. Verifica se a API está acessível publicamente
3. Se necessário, adiciona autenticação (Bearer token)

---

## 🐛 Problemas Comuns

### "Erro ao carregar notícias"
- Verifica se a API está a correr
- Verifica se a URL está correta nas configurações
- Verifica os logs do NestJS

### "Não aparecem notícias"
- Verifica se há notícias com estado "Publicado" na BD
- Verifica se a API retorna dados (testa com curl ou Postman)
- Verifica a consola do browser (F12) para erros JavaScript

### "CORS Error"
- Adiciona o domínio do WordPress ao CORS no NestJS:
  ```typescript
  app.enableCors({
    origin: ['http://localhost', 'https://seudominio.com'],
  });
  ```

---

## 📝 Personalização

### Alterar número de notícias por página:
No ficheiro `page-lista-noticias-api.php`, linha ~150:
```php
$per_page = 20; // Alterar este número
```

### Filtrar por estado:
A página já filtra apenas notícias "Publicado". Para alterar:
```php
// Linha ~130
return strtolower($estado) === 'publicado';
```

### Adicionar mais filtros:
1. Adiciona campos ao formulário
2. Adiciona parâmetros à chamada da API
3. Usa o endpoint `/portal_noticias/noticias/v2` que já suporta filtros

---

## ✅ Checklist

- [ ] WordPress instalado com MySQL
- [ ] API NestJS a correr e acessível
- [ ] URL da API configurada no WordPress
- [ ] Ficheiros copiados para a pasta do tema
- [ ] Código adicionado ao `functions.php`
- [ ] Página criada com template "Lista de Notícias (API)"
- [ ] Testar se aparecem notícias

---

## 🚀 Próximos Passos

1. Criar página individual para cada notícia
2. Adicionar cache para melhorar performance
3. Adicionar paginação avançada
4. Adicionar mais filtros (categoria, data, etc.)







