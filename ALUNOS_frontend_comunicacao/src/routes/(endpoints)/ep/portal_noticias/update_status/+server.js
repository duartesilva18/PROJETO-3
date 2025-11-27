import { PUBLIC_API_URL } from "$env/static/public";
import { checkPermissaoRotas } from "$lib/server/sv_uteis.js";
import { json } from "@sveltejs/kit";

export async function GET({url, cookies, fetch, locals}) {
    let id_noticia = url.searchParams.get('id_noticia')
    let status = url.searchParams.get('status')

    const permissoes_acesso_rota = ["/portal_noticias"];
    if(!checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)){
        return json({error: 401, message: "Não autorizado a aceder a este endpoint"}, {status: 401});
    }


    try {
      console.log('Atualizando status da notícia com ID:', id_noticia);
      const subURL = PUBLIC_API_URL + `portal_noticias/noticias/${id_noticia}/status`;

      const response = await fetch(subURL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + (locals?.info_utili.jwt_api),
        },
        body: JSON.stringify({ estado: status }), // Enviar apenas o estado atualizado
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
      }
  
      const data = await response.json();
      return json(data, { status: 200 }); // 🔥 Agora retorna um `json()` válido!
    } catch (error) {
      console.error('Erro ao atualizar o status da notícia:', error);
      return json({ error: 500, message: error.message }, { status: 500 });
      
    }
  }