import { PUBLIC_API_URL } from "$env/static/public";
import { checkPermissaoRotas } from "$lib/server/sv_uteis";
import { json } from "@sveltejs/kit";

export async function POST({ url,cookies, fetch, locals, request}) {

    let js = await request.json()

    const permissoes_acesso_rota = ["/portal_noticias"];
    if(!checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)){
        return json({error: 401, message: "Não autorizado a aceder a este endpoint"}, {status: 401});
    }


    const response = await fetch(PUBLIC_API_URL + 'portal_noticias/redessociais/facebook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + (locals?.info_utili.jwt_api),
      },
      body: JSON.stringify(js),
    });
  
    // Certifique-se de verificar se a resposta foi bem-sucedida antes de processar o JSON
    if (!response.ok) {
      return json({ error: response.status, message: 'Erro ao comunicar com o endpoint da API' }, { status: response.status });
    }
  
    const responseData = await response.json();
    return json(responseData); // Retornando a resposta como um JSON válido para o SvelteKit
  }