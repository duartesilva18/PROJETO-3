import { PUBLIC_API_URL } from "$env/static/public";
import { checkPermissaoRotas } from "$lib/server/sv_uteis";
import { json } from "@sveltejs/kit";

export async function PUT({ url, fetch, locals }) {
  const permissoes_acesso_rota = ["/portal_noticias"];
  if (!checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)) {
    return json({ error: 401, message: "Não autorizado a aceder a este endpoint" }, { status: 401 });
  }

  const tagId = url.searchParams.get('id_tag');
  if (!tagId) {
    return json({ error: 400, message: "Parâmetro id_tag em falta" }, { status: 400 });
  }

  const subURL = `${PUBLIC_API_URL}portal_noticias/tags/${tagId}/activate`;

  try {
    const response = await fetch(subURL, {
      method: 'PUT',
      headers: {
        "Authorization": "Bearer " + (locals?.info_utili.jwt_api),
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro ao ativar tag na API:", data);
      return json({ error: response.status, message: data.message }, { status: response.status });
    }

    return json(data);
  } catch (error) {
    console.error('Error activating tag (proxy):', error);
    return json({ error: 500, message: "Erro interno ao ativar tag" }, { status: 500 });
  }
}
