<?php
/**
 * Template Name: Lista de Notícias
 * 
 * Template personalizado para exibir a lista de notícias do IPVC
 * Baseado em: https://www.ipvc.pt/lista-noticias/
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
            <form method="get" action="<?php echo esc_url(get_permalink()); ?>" class="search-filters-form">
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
                            // Obter unidades orgânicas (pode ser uma taxonomia personalizada ou campo ACF)
                            $unidades = get_terms(array(
                                'taxonomy' => 'unidade_organica', // Ajustar conforme necessário
                                'hide_empty' => false,
                            ));
                            
                            $selected_unidade = isset($_GET['unidade_organica']) ? $_GET['unidade_organica'] : '';
                            
                            foreach ($unidades as $unidade) {
                                $selected = ($selected_unidade == $unidade->term_id) ? 'selected' : '';
                                echo '<option value="' . esc_attr($unidade->term_id) . '" ' . $selected . '>' . esc_html($unidade->name) . '</option>';
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
        <div class="noticias-list">
            <?php
            // Parâmetros da query
            $paged = (get_query_var('paged')) ? get_query_var('paged') : 1;
            $search_query = isset($_GET['s']) ? sanitize_text_field($_GET['s']) : '';
            $unidade_filter = isset($_GET['unidade_organica']) ? intval($_GET['unidade_organica']) : '';
            
            $args = array(
                'post_type' => 'post', // ou 'noticia' se for um post type personalizado
                'posts_per_page' => 20,
                'paged' => $paged,
                'post_status' => 'publish',
                'orderby' => 'date',
                'order' => 'DESC',
            );
            
            // Adicionar pesquisa
            if (!empty($search_query)) {
                $args['s'] = $search_query;
            }
            
            // Adicionar filtro por unidade orgânica
            if (!empty($unidade_filter)) {
                $args['tax_query'] = array(
                    array(
                        'taxonomy' => 'unidade_organica',
                        'field' => 'term_id',
                        'terms' => $unidade_filter,
                    ),
                );
            }
            
            $noticias_query = new WP_Query($args);
            
            if ($noticias_query->have_posts()) :
                while ($noticias_query->have_posts()) : $noticias_query->the_post();
                    $post_date = get_the_date('d/m/Y');
                    ?>
                    <div class="noticia-item">
                        <a href="<?php the_permalink(); ?>" class="noticia-link">
                            <span class="noticia-title"><?php the_title(); ?></span>
                            <span class="noticia-date"><?php echo esc_html($post_date); ?></span>
                        </a>
                    </div>
                    <?php
                endwhile;
                
                // Paginação
                ?>
                <div class="pagination-wrapper">
                    <?php
                    echo paginate_links(array(
                        'total' => $noticias_query->max_num_pages,
                        'current' => $paged,
                        'prev_text' => '« Anterior',
                        'next_text' => 'Próximo »',
                        'type' => 'list',
                    ));
                    ?>
                </div>
                <?php
            else :
                ?>
                <div class="no-results">
                    <p>Nenhuma notícia encontrada.</p>
                </div>
                <?php
            endif;
            
            wp_reset_postdata();
            ?>
        </div>
    </div>
</div>

<?php get_footer(); ?>





