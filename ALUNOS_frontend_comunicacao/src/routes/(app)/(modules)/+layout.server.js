import { PUBLIC_API_URL, PUBLIC_CAMINHO_SVELTEKIT, PUBLIC_ON_MAIN_URL_BASE } from '$env/static/public';
import { encryptUrlOnV2 } from '$lib/server/sv_uteis';
import { awaitJsImports } from '$lib/stores/awaitJsImports';
import { locale } from '$lib/translations/translations';

/** @type {import('@sveltejs/kit').ServerLoad} */
export const load = async ({ depends, locals, cookies }) => {
    depends("global:layout")
    //
    // MODULOS
    //
    let sidebar_modulos = [];
    try {
        sidebar_modulos = await fetch(PUBLIC_API_URL + "modulos", {
            method: "POST",
            headers: {
                // @ts-ignore
                "Authorization": "Bearer " + (locals?.info_utili.jwt_api),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // @ts-ignore
                id_utilizador: locals?.info_utili.id_utilizador,
                lang: locale.get()
            })
        }).then(d => d.json());
    } catch (err) {
        console.warn('[layout.server] API indisponível (modulos):', err?.cause?.code || err?.message);
        sidebar_modulos = [];
    }

    // urls V1 e V2
    if(Array.isArray(sidebar_modulos)){
        sidebar_modulos.forEach(function (md, idx) {
            if(md.path.startsWith("v1")){
                sidebar_modulos[idx].link = PUBLIC_ON_MAIN_URL_BASE + md.path;
            } else {
                if(md.path.includes(".php")){
                    // encriptada php
                    // @ts-ignore
                    sidebar_modulos[idx].link = PUBLIC_ON_MAIN_URL_BASE + "dash.php?env=" + encryptUrlOnV2(encodeURI(`${md.path}?modulo_id=${md.id_modulo}&modulo_prefixo=${md.prefixo}&modulo_name=${md.descricao}`), locals.on_p_key)
                } else {
                    if(!md.path.startsWith("/")) md.path = "/" + md.path;
                    md.path = md.path.replace(PUBLIC_CAMINHO_SVELTEKIT, "");
                    sidebar_modulos[idx].link = md.path
                }
            }
        })
    };

    // Filtrar módulos para não mostrar o módulo de exemplos na navbar
    if (Array.isArray(sidebar_modulos)) {
        sidebar_modulos = sidebar_modulos.filter((md) => {
            const path = md.path || '';
            const prefixo = md.prefixo || '';
            const desc = (md.descricao || '').toString().toLowerCase();

            // qualquer módulo cujo path ou prefixo contenha "exemplos" é escondido
            if (path.includes('exemplos') || prefixo.includes('exemplos') || desc.includes('exemplo')) {
                return false;
            }

            return true;
        });
    }

    //
    // AREAS
    //
    let sidebar_areas = [];
    const rawModId = parseInt(cookies.get("modid") || "0");
    // força a usar o módulo do Portal de Notícias em vez do módulo de exemplos (id 1)
    const effectiveModId = rawModId === 1 ? 2 : rawModId;

    try {
        sidebar_areas = await fetch(PUBLIC_API_URL + "objetos", {
            method: "POST",
            headers: {
                // @ts-ignore
                "Authorization": "Bearer " + (locals?.info_utili.jwt_api),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // @ts-ignore
                id_utilizador: locals?.info_utili.id_utilizador,
                id_modulo: effectiveModId,
                lang: locale.get()
            })
        }).then(d => d.json());
    } catch (err) {
        console.warn('[layout.server] API indisponível (objetos):', err?.cause?.code || err?.message);
        sidebar_areas = [];
    }
    // urls V1 e V2
    if(Array.isArray(sidebar_areas)){
        sidebar_areas.forEach(function (area, idx) {
            if(Array.isArray(area.objetos)){
                area.objetos.forEach(function(/** @type {any} */ objeto, /** @type {any} */ idx_o){
                    if(objeto.talvez_v1 && area.path_v1 != null){
                        objeto.ficheiro = PUBLIC_ON_MAIN_URL_BASE + area.path_v1;
                    } else {
                        if(objeto.ficheiro.includes(".php")){
                            // encriptada php
                            // @ts-ignore
                            let env2 = encryptUrlOnV2(encodeURI(`${area.prefixo}/${objeto.ficheiro}?modulo_id=${area.id_modulo}&modulo_prefixo=${area.prefixo}&modulo_name=${area.modulo}&objeto_name=${objeto.descricao}`), locals.on_p_key);
                            sidebar_areas[idx].objetos[idx_o].ficheiro = PUBLIC_ON_MAIN_URL_BASE + "dash.php?env=" + encryptUrlOnV2(encodeURI(`${area.path}?modulo_id=${area.id_modulo}&modulo_prefixo=${area.prefixo}&modulo_name=${area.modulo}&next=${env2}`), locals.on_p_key)
                        }
                    }
                })
            }
        })
    };

    return {
        sidebar_modulos: sidebar_modulos,
        sidebar_areas: sidebar_areas,
    }

}