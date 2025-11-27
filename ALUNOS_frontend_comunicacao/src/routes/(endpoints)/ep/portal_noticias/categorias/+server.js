import { PUBLIC_API_URL } from "$env/static/public";
import { checkPermissaoRotas } from "$lib/server/sv_uteis";
import { json } from "@sveltejs/kit";

export async function GET({ url, cookies, fetch, locals }) {

    const permissoes_acesso_rota = ["/portal_noticias"];
    if (!checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)) {
        return json(
            { error: 401, message: "Não autorizado a aceder a este endpoint" },
            { status: 401 }
        );
    }

    // CORRIGIDO – usa o endpoint correto do backend
    const subURL = PUBLIC_API_URL + 'portal_noticias/categorias';

    try {
        const response = await fetch(subURL, {
            headers: {
                "Authorization": "Bearer " + locals?.info_utili.jwt_api,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao obter as categorias');
        }

        const data = await response.json();
        return json(data); // resposta correta

    } catch (error) {
        console.error('Erro ao obter as categorias:', error);
        return json({ error: "Erro ao obter categorias" }, { status: 500 });
    }
}
