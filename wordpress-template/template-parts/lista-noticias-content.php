<?php
/**
 * Template part para conteúdo da lista de notícias
 * Pode ser usado tanto no template de página quanto no shortcode
 */

// Verificar se a query foi passada
if (!isset($noticias_query)) {
    return;
}
?>

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
                    $unidades = get_terms(array(
                        'taxonomy' => 'unidade_organica',
                        'hide_empty' => false,
                    ));
                    
                    $selected_unidade = isset($_GET['unidade_organica']) ? $_GET['unidade_organica'] : '';
                    
                    if (!is_wp_error($unidades) && !empty($unidades)) {
                        foreach ($unidades as $unidade) {
                            $selected = ($selected_unidade == $unidade->term_id) ? 'selected' : '';
                            echo '<option value="' . esc_attr($unidade->term_id) . '" ' . $selected . '>' . esc_html($unidade->name) . '</option>';
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
<div class="noticias-list">
    <?php
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
        if (isset($atts['mostrar_paginacao']) && $atts['mostrar_paginacao'] === 'true') {
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
        }
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







