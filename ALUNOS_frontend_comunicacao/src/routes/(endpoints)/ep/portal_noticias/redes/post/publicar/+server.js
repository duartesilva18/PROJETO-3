import { PUBLIC_API_URL } from '$env/static/public';
import { checkPermissaoRotas } from '$lib/server/sv_uteis';
import { json } from '@sveltejs/kit';

export async function POST({ request, fetch, locals }) {
	const body = await request.json();
	const id_noticia = body?.id_noticia;

	if (!id_noticia) {
		return json({ message: 'id_noticia é obrigatório' }, { status: 400 });
	}

	const permissoes_acesso_rota = ['/portal_noticias'];
	if (!checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)) {
		return json({ error: 401, message: 'Não autorizado a aceder a este endpoint' }, { status: 401 });
	}

	const response = await fetch(`${PUBLIC_API_URL}portal_noticias/redessociais/publicar/${id_noticia}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: 'Bearer ' + locals?.info_utili.jwt_api
		}
	});

	const data = await response.json();

	if (!response.ok) {
		return json(data, { status: response.status });
	}

	return json(data);
}




