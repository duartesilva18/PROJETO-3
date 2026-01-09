# 📖 Guia de Instalação - Lista de Notícias WordPress

## Pré-requisitos

1. **Ter WordPress instalado** (localmente ou num servidor)
2. **Acesso ao painel de administração** do WordPress
3. **Acesso aos ficheiros** do WordPress (via FTP ou diretamente no servidor)

---

## 🚀 Método 1: Instalação Simples (Recomendado para Iniciantes)

### Passo 1: Localizar a Pasta do Tema

1. Acede à pasta do WordPress (normalmente `wp-content/themes/`)
2. Abre a pasta do **tema que estás a usar** (ex: `twentytwentyfour`, `astra`, ou outro)

### Passo 2: Copiar os Ficheiros

Copia estes 2 ficheiros para a pasta do tema:
- ✅ `page-lista-noticias.php`
- ✅ `style-lista-noticias.css`

**Exemplo de caminho completo:**
```
wp-content/themes/twentytwentyfour/page-lista-noticias.php
wp-content/themes/twentytwentyfour/style-lista-noticias.css
```

### Passo 3: Adicionar Código ao functions.php

1. Abre o ficheiro `functions.php` do tema (na mesma pasta)
2. **No final do ficheiro**, adiciona todo o código que está em `functions-lista-noticias.php`
3. Guarda o ficheiro

### Passo 4: Criar a Página no WordPress

1. Entra no **painel de administração** do WordPress
2. Vai a **Páginas → Adicionar Nova**
3. Dá um nome à página (ex: "Lista de Notícias")
4. No lado direito, em **Atributos da Página**, procura **Modelo** ou **Template**
5. Seleciona **"Lista de Notícias"** no dropdown
6. Clica em **Publicar**

### Passo 5: Ver a Página

1. Clica em **Ver página** ou vai ao URL da página
2. A página deve aparecer com o formulário de pesquisa e lista de notícias!

---

## 🔧 Método 2: Como Plugin (Alternativa)

### Passo 1: Criar Pasta do Plugin

1. Vai à pasta `wp-content/plugins/`
2. Cria uma nova pasta chamada `lista-noticias-ipvc`

### Passo 2: Copiar Todos os Ficheiros

Copia **todos os ficheiros** para a pasta `lista-noticias-ipvc`:
- ✅ `lista-noticias-ipvc.php`
- ✅ `page-lista-noticias.php`
- ✅ `style-lista-noticias.css`
- ✅ `template-parts/lista-noticias-content.php` (cria a pasta `template-parts` primeiro)

### Passo 3: Ativar o Plugin

1. Entra no **painel de administração** do WordPress
2. Vai a **Plugins → Plugins Instalados**
3. Procura **"Lista de Notícias IPVC"**
4. Clica em **Ativar**

### Passo 4: Criar a Página

1. Vai a **Páginas → Adicionar Nova**
2. Dá um nome à página
3. Seleciona o template **"Lista de Notícias"**
4. Publica a página

---

## ❓ Onde Está a Pasta do WordPress?

### Se tens WordPress Local (XAMPP, Local by Flywheel, etc.)

**Windows:**
```
C:\xampp\htdocs\nome-do-site\wp-content\themes\
```

**Mac:**
```
/Applications/MAMP/htdocs/nome-do-site/wp-content/themes/
```

### Se tens WordPress num Servidor (Hosting)

1. Liga-te via **FTP** (FileZilla, WinSCP, etc.)
2. Navega até `public_html/wp-content/themes/` (ou `www/wp-content/themes/`)
3. Abre a pasta do tema ativo

### Como Saber Qual é o Tema Ativo?

1. Entra no WordPress Admin
2. Vai a **Aparência → Temas**
3. O tema com a borda azul é o tema ativo
4. Clica em **Detalhes** para ver o nome exato

---

## 🎯 Verificação Rápida

Depois de instalar, verifica:

- [ ] Os ficheiros estão na pasta correta do tema?
- [ ] O código foi adicionado ao `functions.php`?
- [ ] A página foi criada no WordPress?
- [ ] O template "Lista de Notícias" foi selecionado?

---

## 🐛 Problemas Comuns

### "Não vejo o template na lista"
- Verifica se `page-lista-noticias.php` está na pasta correta do tema
- Verifica se o código do `functions.php` foi adicionado corretamente

### "A página aparece em branco"
- Verifica se há erros no `functions.php` (pode ter sintaxe incorreta)
- Verifica os logs de erro do WordPress

### "Os estilos não aparecem"
- Verifica se `style-lista-noticias.css` está na mesma pasta do tema
- Verifica se o caminho no `functions.php` está correto

### "Não aparecem notícias"
- Verifica se tens posts publicados no WordPress
- Verifica se os posts têm a taxonomia "Unidade Orgânica" (se usares o filtro)

---

## 📞 Precisa de Ajuda?

Se tiveres problemas:
1. Verifica se todos os ficheiros foram copiados
2. Verifica se não há erros de sintaxe no código
3. Verifica os logs de erro do WordPress

---

## ✅ Checklist Final

- [ ] WordPress instalado e funcionando
- [ ] Ficheiros copiados para a pasta correta
- [ ] Código adicionado ao `functions.php`
- [ ] Plugin ativado (se usar método 2)
- [ ] Página criada no WordPress
- [ ] Template selecionado
- [ ] Página acessível e funcionando







