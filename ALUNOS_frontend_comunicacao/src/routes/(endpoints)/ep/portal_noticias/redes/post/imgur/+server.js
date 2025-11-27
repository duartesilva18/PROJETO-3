import { PUBLIC_API_URL } from "$env/static/public";
import { checkPermissaoRotas } from "$lib/server/sv_uteis.js";
import { json } from "@sveltejs/kit";

export async function POST({ url, cookies, fetch, locals, request }) {
    const js = await request.json();

    const permissoes_acesso_rota = ["/portal_noticias"];
    if (!checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)) {
        return json({ error: 401, message: "Não autorizado a aceder a este endpoint" }, { status: 401 });
    }

    try {
        const response = await fetch(PUBLIC_API_URL + 'portal_noticias/redessociais/imgur', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: "Bearer " + (locals?.info_utili.jwt_api),
            },
            body: JSON.stringify(js),
        });

        if (!response.ok) {
            console.error('Erro na resposta da API:', response.status, response.statusText);
            return json({ error: response.status, message: 'Erro ao conectar com o Imgur' }, { status: response.status });
        }

        const data = await response.json();
        return json(data);
    } catch (error) {
        console.error('Erro inesperado:', error);
        return json({ error: 500, message: 'Erro interno no servidor' }, { status: 500 });
    }
}
