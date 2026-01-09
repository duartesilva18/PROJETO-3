# 🚀 Como Instalar WordPress e Usar a Página de Notícias

## PARTE 1: Instalar WordPress

### Opção A: Instalar Localmente (no teu computador)

#### Passo 1: Instalar XAMPP (se ainda não tens)

1. **Descarrega XAMPP:**
   - Vai a: https://www.apachefriends.org/
   - Descarrega a versão para Windows
   - Instala o XAMPP

2. **Iniciar XAMPP:**
   - Abre o XAMPP Control Panel
   - Clica em **Start** ao lado de **Apache**
   - Clica em **Start** ao lado de **MySQL**
   - Ambos devem ficar verdes ✅

#### Passo 2: Extrair WordPress

1. **Extrai o ficheiro ZIP do WordPress** que tens
2. **Copia a pasta extraída** para:
   ```
   C:\xampp\htdocs\
   ```
   
   **Exemplo:** Se extraíste uma pasta chamada `wordpress`, fica:
   ```
   C:\xampp\htdocs\wordpress\
   ```

#### Passo 3: Criar Base de Dados

1. Abre o browser e vai a: **http://localhost/phpmyadmin**
2. Clica em **Novo** (New) no lado esquerdo
3. Dá um nome à base de dados (ex: `wordpress_db`)
4. Escolhe **utf8_general_ci** como collation
5. Clica em **Criar**

#### Passo 4: Instalar WordPress

1. Abre o browser e vai a: **http://localhost/wordpress** (ou o nome da pasta)
2. Escolhe o idioma (Português)
3. Clica em **Vamos começar!**
4. Preenche:
   - **Nome da base de dados:** `wordpress_db` (ou o nome que deste)
   - **Nome de utilizador:** `root`
   - **Palavra-passe:** (deixa em branco)
   - **Servidor da base de dados:** `localhost`
   - **Prefixo da tabela:** `wp_` (deixa assim)
5. Clica em **Submeter**
6. Clica em **Executar a instalação**
7. Preenche:
   - **Título do site:** (ex: "Meu Site")
   - **Nome de utilizador:** (escolhe um nome)
   - **Palavra-passe:** (escolhe uma palavra-passe forte)
   - **O teu e-mail:** (o teu email)
8. Clica em **Instalar WordPress**
9. **Anota o nome de utilizador e palavra-passe!**

#### Passo 5: Entrar no WordPress

1. Vai a: **http://localhost/wordpress/wp-admin**
2. Entra com o nome de utilizador e palavra-passe que criaste
3. ✅ **WordPress instalado!**

---

### Opção B: Instalar num Servidor (Hosting)

#### Passo 1: Fazer Upload do WordPress

1. **Liga-te via FTP** ao teu servidor (usa FileZilla, WinSCP, etc.)
2. **Extrai o ZIP do WordPress** no teu computador
3. **Faz upload de TODA a pasta** para:
   - `public_html/` ou
   - `www/` ou
   - `htdocs/`
   (depende do teu hosting)

#### Passo 2: Criar Base de Dados

1. Entra no **painel de controlo** do teu hosting (cPanel, Plesk, etc.)
2. Vai a **MySQL Databases** ou **Bases de Dados**
3. Cria uma nova base de dados (ex: `meusite_db`)
4. Cria um utilizador para a base de dados
5. **Anota:** nome da base de dados, utilizador e palavra-passe

#### Passo 3: Instalar WordPress

1. Abre o browser e vai ao teu domínio (ex: `https://meusite.com`)
2. Segue os mesmos passos da Opção A, mas usa:
   - Os dados da base de dados que criaste no hosting
   - O utilizador e palavra-passe da base de dados (não `root`)

---

## PARTE 2: Adicionar a Página de Lista de Notícias

### Passo 1: Encontrar a Pasta do Tema

**Se instalaste localmente:**
```
C:\xampp\htdocs\wordpress\wp-content\themes\
```

**Se instalaste num servidor:**
- Liga-te via FTP
- Vai a: `wp-content/themes/`

### Passo 2: Ver Qual é o Tema Ativo

1. Entra no WordPress Admin: **http://localhost/wordpress/wp-admin**
2. Vai a **Aparência → Temas**
3. O tema com a borda azul é o tema ativo
4. **Anota o nome do tema** (ex: `twentytwentyfour`)

### Passo 3: Copiar os Ficheiros

1. Abre a pasta do tema ativo:
   ```
   C:\xampp\htdocs\wordpress\wp-content\themes\twentytwentyfour\
   ```
   (substitui `twentytwentyfour` pelo nome do teu tema)

2. **Copia estes 2 ficheiros** para essa pasta:
   - ✅ `page-lista-noticias.php`
   - ✅ `style-lista-noticias.css`

### Passo 4: Editar functions.php

1. Na mesma pasta do tema, abre o ficheiro `functions.php`
2. **No final do ficheiro**, adiciona TODO o código que está em `functions-lista-noticias.php`
3. **Guarda o ficheiro**

### Passo 5: Criar a Página no WordPress

1. No WordPress Admin, vai a **Páginas → Adicionar Nova**
2. Dá um nome: **"Lista de Notícias"**
3. No lado direito, procura **"Atributos da Página"**
4. Em **"Modelo"** ou **"Template"**, seleciona **"Lista de Notícias"**
5. Clica em **Publicar**

### Passo 6: Ver a Página!

1. Clica em **Ver página** ou vai ao URL da página
2. ✅ **A página deve aparecer com pesquisa e lista de notícias!**

---

## ✅ Checklist Completo

- [ ] XAMPP instalado e Apache/MySQL a correr (se local)
- [ ] WordPress extraído e colocado na pasta correta
- [ ] Base de dados criada
- [ ] WordPress instalado e funcionando
- [ ] Consegues entrar no WordPress Admin
- [ ] Ficheiros `page-lista-noticias.php` e `style-lista-noticias.css` copiados para a pasta do tema
- [ ] Código adicionado ao `functions.php`
- [ ] Página criada no WordPress com o template "Lista de Notícias"
- [ ] Página acessível e funcionando

---

## 🆘 Problemas Comuns

### "Não consigo aceder a localhost"
- Verifica se o Apache está a correr no XAMPP
- Tenta: `http://127.0.0.1/wordpress` em vez de `localhost`

### "Erro ao ligar à base de dados"
- Verifica se o MySQL está a correr no XAMPP
- Verifica se o nome da base de dados está correto
- Se for local, a palavra-passe deve estar vazia

### "Não vejo o template na lista"
- Verifica se `page-lista-noticias.php` está na pasta correta do tema
- Verifica se o código foi adicionado ao `functions.php`

### "Página em branco"
- Verifica se há erros no `functions.php` (pode ter sintaxe incorreta)
- Verifica se todos os ficheiros foram copiados

---

## 📞 Próximos Passos

Depois de instalares:
1. Cria algumas notícias/posts no WordPress
2. Testa a página de lista de notícias
3. Personaliza os estilos se necessário







