<?php
/**
 * Plugin Name: Lista de Notícias IPVC
 * Plugin URI: https://www.ipvc.pt
 * Description: Template personalizado para exibir lista de notícias estilo IPVC
 * Version: 1.0.0
 * Author: Seu Nome
 * Author URI: https://www.ipvc.pt
 * License: GPL v2 or later
 * Text Domain: lista-noticias-ipvc
 */

// Prevenir acesso direto
if (!defined('ABSPATH')) {
    exit;
}

// Definir constantes
define('LISTA_NOTICIAS_VERSION', '1.0.0');
define('LISTA_NOTICIAS_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('LISTA_NOTICIAS_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Enfileirar estilos CSS
 */
function lista_noticias_enqueue_styles() {
    if (is_page_template('page-lista-noticias.php') || has_shortcode(get_post()->post_content, 'lista_noticias')) {
        wp_enqueue_style(
            'lista-noticias-style',
            LISTA_NOTICIAS_PLUGIN_URL . 'style-lista-noticias.css',
            array(),
            LISTA_NOTICIAS_VERSION
        );
    }
}
add_action('wp_enqueue_scripts', 'lista_noticias_enqueue_styles');

/**
 * Registrar template de página
 */
function lista_noticias_register_template($templates) {
    $templates['page-lista-noticias.php'] = 'Lista de Notícias';
    return $templates;
}
add_filter('theme_page_templates', 'lista_noticias_register_template');

/**
 * Carregar template quando selecionado
 */
function lista_noticias_load_template($template) {
    global $post;
    
    if (!$post) {
        return $template;
    }
    
    $page_template = get_post_meta($post->ID, '_wp_page_template', true);
    
    if ($page_template === 'page-lista-noticias.php') {
        $file = LISTA_NOTICIAS_PLUGIN_DIR . 'page-lista-noticias.php';
        if (file_exists($file)) {
            return $file;
        }
    }
    
    return $template;
}
add_filter('template_include', 'lista_noticias_load_template');

/**
 * Criar taxonomia "Unidade Orgânica"
 */
function lista_noticias_criar_taxonomia() {
    $labels = array(
        'name' => 'Unidades Orgânicas',
        'singular_name' => 'Unidade Orgânica',
        'menu_name' => 'Unidades Orgânicas',
        'all_items' => 'Todas as Unidades Orgânicas',
        'edit_item' => 'Editar Unidade Orgânica',
        'view_item' => 'Ver Unidade Orgânica',
        'update_item' => 'Atualizar Unidade Orgânica',
        'add_new_item' => 'Adicionar Nova Unidade Orgânica',
        'new_item_name' => 'Nome da Nova Unidade Orgânica',
        'search_items' => 'Pesquisar Unidades Orgânicas',
        'popular_items' => 'Unidades Orgânicas Populares',
        'separate_items_with_commas' => 'Separar unidades orgânicas com vírgulas',
        'add_or_remove_items' => 'Adicionar ou remover unidades orgânicas',
        'choose_from_most_used' => 'Escolher das mais usadas',
        'not_found' => 'Nenhuma unidade orgânica encontrada',
    );
    
    $args = array(
        'hierarchical' => true,
        'labels' => $labels,
        'show_ui' => true,
        'show_admin_column' => true,
        'query_var' => true,
        'rewrite' => array('slug' => 'unidade-organica'),
        'show_in_rest' => true, // Suporte para Gutenberg
    );
    
    register_taxonomy('unidade_organica', array('post'), $args);
}
add_action('init', 'lista_noticias_criar_taxonomia');

/**
 * Shortcode para lista de notícias
 */
function shortcode_lista_noticias($atts) {
    $atts = shortcode_atts(array(
        'posts_per_page' => 20,
        'unidade_organica' => '',
        'categoria' => '',
        'mostrar_paginacao' => 'true',
    ), $atts);
    
    ob_start();
    
    // Parâmetros da query
    $paged = (get_query_var('paged')) ? get_query_var('paged') : 1;
    $search_query = isset($_GET['s']) ? sanitize_text_field($_GET['s']) : '';
    $unidade_filter = isset($_GET['unidade_organica']) ? intval($_GET['unidade_organica']) : '';
    
    if (!empty($atts['unidade_organica'])) {
        $unidade_filter = intval($atts['unidade_organica']);
    }
    
    $args = array(
        'post_type' => 'post',
        'posts_per_page' => intval($atts['posts_per_page']),
        'paged' => $paged,
        'post_status' => 'publish',
        'orderby' => 'date',
        'order' => 'DESC',
    );
    
    if (!empty($search_query)) {
        $args['s'] = $search_query;
    }
    
    if (!empty($unidade_filter)) {
        $args['tax_query'] = array(
            array(
                'taxonomy' => 'unidade_organica',
                'field' => 'term_id',
                'terms' => $unidade_filter,
            ),
        );
    }
    
    if (!empty($atts['categoria'])) {
        $args['category_name'] = sanitize_text_field($atts['categoria']);
    }
    
    $noticias_query = new WP_Query($args);
    
    // Incluir template
    include(LISTA_NOTICIAS_PLUGIN_DIR . 'template-parts/lista-noticias-content.php');
    
    return ob_get_clean();
}
add_shortcode('lista_noticias', 'shortcode_lista_noticias');

/**
 * Ativação do plugin
 */
function lista_noticias_activate() {
    lista_noticias_criar_taxonomia();
    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'lista_noticias_activate');

/**
 * Desativação do plugin
 */
function lista_noticias_deactivate() {
    flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, 'lista_noticias_deactivate');







