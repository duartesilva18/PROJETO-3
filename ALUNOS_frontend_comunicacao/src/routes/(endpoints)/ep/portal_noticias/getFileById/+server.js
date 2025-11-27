import { PUBLIC_API_URL } from "$env/static/public";
import { checkPermissaoRotas } from "$lib/server/sv_uteis";
import { json } from "@sveltejs/kit";

export async function GET({url, cookies, fetch, locals}) {
    // para aceder a esta rota, é necessária uma das seguintes permissões:
    const permissoes_acesso_rota = ["/portal_noticias"];
    if(!checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)){
        return json({error: 401, message: "Não autorizado a aceder a este endpoint"}, {status: 401});
    }

    let id = url.searchParams.get('id')
    return await fetch(PUBLIC_API_URL + `portal_noticias/anexos/${id}`, {
        headers: {
            // @ts-ignore
            "Authorization": "Bearer " + (locals?.info_utili.jwt_api),
            'Content-Type': 'application/json'
        }
    })
}