import { PUBLIC_API_URL } from "$env/static/public";
import { checkPermissaoRotas } from "$lib/server/sv_uteis";
import { json } from "@sveltejs/kit";

export async function GET({url, cookies, fetch, locals}) {

    let id = url.searchParams.get('id')

    const subURL = `${PUBLIC_API_URL}portal_noticias/noticias/${id}`;

    const permissoes_acesso_rota = ["/portal_noticias"];
    if(!checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)){
        return json({error: 401, message: "Não autorizado a aceder a este endpoint"}, {status: 401});
    }

  
    try {
        const response = await fetch(subURL,{
            headers: {
                // @ts-ignore
                "Authorization": "Bearer " + (locals?.info_utili.jwt_api),
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error('Erro ao obter a notícia');
        }
        const data = await response.json();
        return json(data);
    } catch (error) {
        console.error('Erro ao obter a notícia:', error);
        return json(null);
    }
}

export async function DELETE({url, cookies, fetch, locals}) {

    let id = url.searchParams.get('id')

    const subURL = `${PUBLIC_API_URL}portal_noticias/noticias/${id}`;

    const permissoes_acesso_rota = ["/portal_noticias"];
    if(!checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)){
        return json({error: 401, message: "Não autorizado a aceder a este endpoint"}, {status: 401});
    }

  

        const response = await fetch(subURL,{
            method: "DELETE",
            headers: {
                // @ts-ignore
                "Authorization": "Bearer " + (locals?.info_utili.jwt_api),
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error('Erro ao obter a notícia');
        }
        const data = await response.json();
        return json(data);
}