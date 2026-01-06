<?php
/**
 * Funções para a página Lista de Notícias
 * Adicionar este código ao functions.php do tema ou criar um plugin
 */

// Enfileirar estilos CSS
function enqueue_lista_noticias_styles() {
    if (is_page_template('page-lista-noticias.php')) {
        wp_enqueue_style(
            'lista-noticias-style',
            get_template_directory_uri() . '/style-lista-noticias.css',
            array(),
            '1.0.0'
        );
    }
}
add_action('wp_enqueue_scripts', 'enqueue_lista_noticias_styles');

// Criar taxonomia "Unidade Orgânica" se não existir
function criar_taxonomia_unidade_organica() {
    $labels = array(
        'name' => 'Unidades Orgânicas',
        'singular_name' => 'Unidade Orgânica',
        'menu_name' => 'Unidades Orgânicas',
    );
    
    $args = array(
        'hierarchical' => true,
        'labels' => $labels,
        'show_ui' => true,
        'show_admin_column' => true,
        'query_var' => true,
        'rewrite' => array('slug' => 'unidade-organica'),
    );
    
    register_taxonomy('unidade_organica', array('post'), $args);
}
add_action('init', 'criar_taxonomia_unidade_organica');

// Adicionar suporte para paginação personalizada
function lista_noticias_pagination($query) {
    if (!is_admin() && $query->is_main_query() && is_page_template('page-lista-noticias.php')) {
        $query->set('posts_per_page', 20);
    }
}
add_action('pre_get_posts', 'lista_noticias_pagination');

// Função helper para formatar data no formato português
function formatar_data_noticia($date) {
    $timestamp = strtotime($date);
    return date('d/m/Y', $timestamp);
}

// Shortcode alternativo para usar em qualquer página
function shortcode_lista_noticias($atts) {
    $atts = shortcode_atts(array(
        'posts_per_page' => 20,
        'unidade_organica' => '',
        'categoria' => '',
    ), $atts);
    
    ob_start();
    
    // Incluir o template da lista
    include(get_template_directory() . '/template-parts/lista-noticias-content.php');
    
    return ob_get_clean();
}
add_shortcode('lista_noticias', 'shortcode_lista_noticias');





