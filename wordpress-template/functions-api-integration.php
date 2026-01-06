<?php
/**
 * Funções para integração com API NestJS
 * Adicionar este código ao functions.php do tema
 */

// Enfileirar estilos CSS
function enqueue_lista_noticias_api_styles() {
    if (is_page_template('page-lista-noticias-api.php')) {
        wp_enqueue_style(
            'lista-noticias-style',
            get_template_directory_uri() . '/style-lista-noticias.css',
            array(),
            '1.0.0'
        );
    }
}
add_action('wp_enqueue_scripts', 'enqueue_lista_noticias_api_styles');

// Adicionar opção no painel de administração para configurar URL da API
function lista_noticias_api_settings() {
    add_options_page(
        'Configurações Lista de Notícias',
        'Lista de Notícias',
        'manage_options',
        'lista-noticias-api',
        'lista_noticias_api_settings_page'
    );
}
add_action('admin_menu', 'lista_noticias_api_settings');

// Página de configurações
function lista_noticias_api_settings_page() {
    if (isset($_POST['submit'])) {
        $api_url = sanitize_text_field($_POST['api_url']);
        update_option('lista_noticias_api_url', $api_url);
        echo '<div class="notice notice-success"><p>Configurações guardadas!</p></div>';
    }
    
    $api_url = get_option('lista_noticias_api_url', 'http://localhost:3000');
    ?>
    <div class="wrap">
        <h1>Configurações - Lista de Notícias</h1>
        <form method="post" action="">
            <table class="form-table">
                <tr>
                    <th scope="row">
                        <label for="api_url">URL da API NestJS</label>
                    </th>
                    <td>
                        <input 
                            type="text" 
                            id="api_url" 
                            name="api_url" 
                            value="<?php echo esc_attr($api_url); ?>" 
                            class="regular-text"
                            placeholder="http://localhost:3000"
                        />
                        <p class="description">
                            URL base da API NestJS (ex: http://localhost:3000 ou https://api.seudominio.com)
                        </p>
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}

// Função helper para fazer chamadas à API com cache
function lista_noticias_api_get($endpoint, $cache_time = 300) {
    $api_url = get_option('lista_noticias_api_url', 'http://localhost:3000');
    $full_url = rtrim($api_url, '/') . '/' . ltrim($endpoint, '/');
    
    // Verificar cache
    $cache_key = 'lista_noticias_' . md5($full_url);
    $cached = get_transient($cache_key);
    
    if ($cached !== false) {
        return $cached;
    }
    
    // Fazer chamada à API
    $response = wp_remote_get($full_url, array(
        'timeout' => 30,
        'headers' => array(
            'Content-Type' => 'application/json',
        ),
    ));
    
    if (is_wp_error($response)) {
        return false;
    }
    
    $status_code = wp_remote_retrieve_response_code($response);
    
    if ($status_code === 200) {
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        // Guardar no cache
        set_transient($cache_key, $data, $cache_time);
        
        return $data;
    }
    
    return false;
}

// Limpar cache quando necessário
function lista_noticias_clear_cache() {
    global $wpdb;
    $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_lista_noticias_%'");
    $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_lista_noticias_%'");
}





