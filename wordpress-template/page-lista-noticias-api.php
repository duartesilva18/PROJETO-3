<?php
/**
 * Template Name: Lista de Notícias (API)
 * 
 * Template que consome a API NestJS existente para exibir notícias
 * Usa a mesma base de dados SQL Server através da API
 */

get_header(); ?>

<div class="lista-noticias-container">
    <div class="container">
        <!-- Breadcrumb -->
        <nav class="breadcrumb-nav" aria-label="breadcrumb">
            <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="<?php echo home_url(); ?>">Início</a></li>
                <li class="breadcrumb-item active" aria-current="page">Lista de notícias</li>
            </ol>
        </nav>

        <!-- Título da Página -->
        <h1 class="page-title">Lista de notícias</h1>

        <!-- Formulário de Pesquisa e Filtros -->
        <div class="search-filters-section">
            <form method="get" action="<?php echo esc_url(get_permalink()); ?>" class="search-filters-form" id="search-form">
                <div class="search-row">
                    <div class="search-field">
                        <label for="search-text">Inserir texto para pesquisar</label>
                        <input 
                            type="text" 
                            id="search-text" 
                            name="s" 
                            value="<?php echo isset($_GET['s']) ? esc_attr($_GET['s']) : ''; ?>" 
                            placeholder="What do you want to search for?"
                            class="form-control"
                        />
                    </div>
                    
                    <div class="filter-field">
                        <label for="unidade-organica">Select Organic Unit</label>
                        <select 
                            id="unidade-organica" 
                            name="unidade_organica" 
                            class="form-control"
                        >
                            <option value="">Organic Unit</option>
                            <?php
                            // Carregar rádios/jornais da API
                            $api_url = get_option('lista_noticias_api_url', 'http://localhost:3000');
                            $radios_jornais_url = $api_url . '/portal_noticias/radio_jornal';
                            
                            $selected_unidade = isset($_GET['unidade_organica']) ? $_GET['unidade_organica'] : '';
                            
                            // Fazer chamada à API
                            $response = wp_remote_get($radios_jornais_url);
                            
                            if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
                                $body = wp_remote_retrieve_body($response);
                                $radios_jornais = json_decode($body, true);
                                
                                if (is_array($radios_jornais)) {
                                    foreach ($radios_jornais as $item) {
                                        $id = isset($item['id_radio_jornal']) ? $item['id_radio_jornal'] : '';
                                        $nome = isset($item['nome']) ? $item['nome'] : '';
                                        $selected = ($selected_unidade == $id) ? 'selected' : '';
                                        echo '<option value="' . esc_attr($id) . '" ' . $selected . '>' . esc_html($nome) . '</option>';
                                    }
                                }
                            }
                            ?>
                        </select>
                    </div>
                    
                    <div class="search-button">
                        <button type="submit" class="btn btn-primary">
                            <span>Search</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>

        <!-- Lista de Notícias -->
        <div class="noticias-list" id="noticias-list">
            <?php
            // URL da API
            $api_url = get_option('lista_noticias_api_url', 'http://localhost:3000');
            $noticias_url = $api_url . '/portal_noticias/noticias';
            
            // Parâmetros de pesquisa
            $search_query = isset($_GET['s']) ? sanitize_text_field($_GET['s']) : '';
            $unidade_filter = isset($_GET['unidade_organica']) ? sanitize_text_field($_GET['unidade_organica']) : '';
            
            // Adicionar parâmetros à URL se existirem
            $query_params = array();
            if (!empty($search_query)) {
                $query_params['titulo'] = $search_query;
            }
            if (!empty($unidade_filter)) {
                // Nota: A API pode não ter filtro direto por rádio/jornal
                // Pode ser necessário filtrar no lado do cliente ou criar endpoint específico
            }
            
            // Usar endpoint v2 que suporta filtros
            if (!empty($search_query)) {
                $noticias_url = $api_url . '/portal_noticias/noticias/v2?titulo=' . urlencode($search_query);
            } else {
                $noticias_url = $api_url . '/portal_noticias/noticias';
            }
            
            // Fazer chamada à API
            $response = wp_remote_get($noticias_url, array(
                'timeout' => 30,
                'headers' => array(
                    'Content-Type' => 'application/json',
                ),
            ));
            
            if (is_wp_error($response)) {
                echo '<div class="alert alert-danger">Erro ao carregar notícias: ' . esc_html($response->get_error_message()) . '</div>';
            } else {
                $status_code = wp_remote_retrieve_response_code($response);
                
                if ($status_code === 200) {
                    $body = wp_remote_retrieve_body($response);
                    $noticias = json_decode($body, true);
                    
                    if (is_array($noticias) && !empty($noticias)) {
                        // Filtrar por unidade orgânica se necessário (no lado do cliente)
                        if (!empty($unidade_filter)) {
                            $noticias = array_filter($noticias, function($noticia) use ($unidade_filter) {
                                // Verificar se a notícia tem emails que correspondem ao rádio/jornal
                                $emails = isset($noticia['emails']) ? $noticia['emails'] : '';
                                // Esta lógica pode precisar de ajuste conforme a estrutura dos dados
                                return strpos($emails, $unidade_filter) !== false;
                            });
                        }
                        
                        // Filtrar apenas notícias publicadas
                        $noticias = array_filter($noticias, function($noticia) {
                            $estado = isset($noticia['estado']) ? $noticia['estado'] : '';
                            return strtolower($estado) === 'publicado' || strtolower($estado) === 'publicada';
                        });
                        
                        // Ordenar por data (mais recente primeiro)
                        usort($noticias, function($a, $b) {
                            $date_a = isset($a['data_criacao']) ? strtotime($a['data_criacao']) : 0;
                            $date_b = isset($b['data_criacao']) ? strtotime($b['data_criacao']) : 0;
                            return $date_b - $date_a;
                        });
                        
                        // Limitar a 20 notícias por página
                        $paged = isset($_GET['paged']) ? intval($_GET['paged']) : 1;
                        $per_page = 20;
                        $offset = ($paged - 1) * $per_page;
                        $noticias_paginated = array_slice($noticias, $offset, $per_page);
                        
                        foreach ($noticias_paginated as $noticia) {
                            $titulo = isset($noticia['titulo']) ? $noticia['titulo'] : 'Sem título';
                            $id_noticia = isset($noticia['id_noticia']) ? $noticia['id_noticia'] : '';
                            $data_criacao = isset($noticia['data_criacao']) ? $noticia['data_criacao'] : '';
                            
                            // Formatar data
                            $post_date = '';
                            if (!empty($data_criacao)) {
                                $timestamp = strtotime($data_criacao);
                                $post_date = date('d/m/Y', $timestamp);
                            }
                            
                            // URL da notícia (pode precisar de ajuste conforme a estrutura do site)
                            $noticia_url = home_url('/noticia/' . $id_noticia);
                            ?>
                            <div class="noticia-item">
                                <a href="<?php echo esc_url($noticia_url); ?>" class="noticia-link">
                                    <span class="noticia-title"><?php echo esc_html($titulo); ?></span>
                                    <span class="noticia-date"><?php echo esc_html($post_date); ?></span>
                                </a>
                            </div>
                            <?php
                        }
                        
                        // Paginação simples
                        $total_pages = ceil(count($noticias) / $per_page);
                        if ($total_pages > 1) {
                            ?>
                            <div class="pagination-wrapper">
                                <?php
                                $base_url = get_permalink();
                                $query_string = $_SERVER['QUERY_STRING'];
                                
                                for ($i = 1; $i <= $total_pages; $i++) {
                                    $url = $base_url . ($query_string ? '&' : '?') . 'paged=' . $i;
                                    $current = ($i == $paged) ? 'current' : '';
                                    echo '<a href="' . esc_url($url) . '" class="page-numbers ' . $current . '">' . $i . '</a>';
                                }
                                ?>
                            </div>
                            <?php
                        }
                    } else {
                        ?>
                        <div class="no-results">
                            <p>Nenhuma notícia encontrada.</p>
                        </div>
                        <?php
                    }
                } else {
                    echo '<div class="alert alert-warning">Erro ao carregar notícias. Código: ' . esc_html($status_code) . '</div>';
                }
            }
            ?>
        </div>
    </div>
</div>

<?php get_footer(); ?>







