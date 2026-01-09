# Template WordPress - Lista de Notícias IPVC

Este template replica a página de lista de notícias do IPVC: https://www.ipvc.pt/lista-noticias/

## Estrutura de Ficheiros

- `page-lista-noticias.php` - Template de página personalizado
- `style-lista-noticias.css` - Estilos CSS para a página
- `functions-lista-noticias.php` - Funções PHP para adicionar ao functions.php

## Instalação

### Opção 1: Template de Página (Recomendado)

1. Copiar `page-lista-noticias.php` para a pasta do tema ativo:
   ```
   wp-content/themes/seu-tema/page-lista-noticias.php
   ```

2. Copiar `style-lista-noticias.css` para a pasta do tema:
   ```
   wp-content/themes/seu-tema/style-lista-noticias.css
   ```

3. Adicionar o código de `functions-lista-noticias.php` ao `functions.php` do tema

4. Criar uma nova página no WordPress e selecionar o template "Lista de Notícias"

### Opção 2: Plugin Personalizado

1. Criar uma pasta `lista-noticias-ipvc` em `wp-content/plugins/`
2. Copiar todos os ficheiros para essa pasta
3. Criar um ficheiro `lista-noticias-ipvc.php` como ficheiro principal do plugin
4. Ativar o plugin no WordPress

## Funcionalidades

- ✅ Campo de pesquisa de texto
- ✅ Filtro por Unidade Orgânica (taxonomia personalizada)
- ✅ Lista de notícias com título e data
- ✅ Paginação
- ✅ Design responsivo
- ✅ Estilos baseados no site original do IPVC

## Personalização

### Alterar número de notícias por página

No ficheiro `page-lista-noticias.php`, alterar:
```php
'posts_per_page' => 20, // Alterar este número
```

### Alterar post type

Se usar um post type personalizado (ex: 'noticia'), alterar:
```php
'post_type' => 'noticia', // Em vez de 'post'
```

### Adicionar mais filtros

Adicionar novos campos no formulário e processar na query WP_Query.

## Notas

- A taxonomia "Unidade Orgânica" será criada automaticamente
- O template usa o sistema de posts padrão do WordPress
- Os estilos podem ser ajustados no ficheiro CSS







