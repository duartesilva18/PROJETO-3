import { PUBLIC_API_URL } from "$env/static/public";
import { checkPermissaoRotas } from "$lib/server/sv_uteis";
import { json } from "@sveltejs/kit";

export async function GET({ fetch, locals }) {
  const permissoes_acesso_rota = ["/portal_noticias"];
  if (!checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)) {
    return json({ error: 401, message: "Não autorizado a aceder a este endpoint" }, { status: 401 });
  }

  try {
    const subURL = PUBLIC_API_URL + 'portal_noticias/tags';

    const res = await fetch(subURL, {
      headers: {
        "Authorization": "Bearer " + (locals?.info_utili.jwt_api),
        "Content-Type": "application/json"
      }
    });
    const data = await res.json();
    return json(data);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return json([]);
  }
}

export async function DELETE({ url, fetch, locals }) {
  const permissoes_acesso_rota = ["/portal_noticias"];
  if (!checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)) {
    return json({ error: 401, message: "Não autorizado a aceder a este endpoint" }, { status: 401 });
  }

  const tagToRemove = url.searchParams.get('id_tag');
  const subURL = PUBLIC_API_URL + `portal_noticias/tags/${tagToRemove}`;

  try {
    const response = await fetch(subURL, {
      method: 'DELETE',
      headers: {
        "Authorization": "Bearer " + (locals?.info_utili.jwt_api),
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error('Failed to remove tag');
    }

    return json({ removido: true });
  } catch (error) {
    console.error('Error removing tag:', error);
    return json({ removido: false });
  }
}

export async function POST({ fetch, locals, request }) {
  const permissoes_acesso_rota = ["/portal_noticias"];
  if (!checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)) {
    return json({ error: 401, message: "Não autorizado a aceder a este endpoint" }, { status: 401 });
  }

  const data = await request.json();
  const subURL = PUBLIC_API_URL + 'portal_noticias/tags';

  try {
    const response = await fetch(subURL, {
      method: 'POST',
      headers: {
        "Authorization": "Bearer " + (locals?.info_utili.jwt_api),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const js_rp = await response.json();
      return json(js_rp, { status: response.status });
    }

    const addedTag = await response.json();
    return json(addedTag);
  } catch (error) {
    console.error('Error adding tag:', error);
    return json(null);
  }
}
