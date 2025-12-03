import { PUBLIC_API_URL } from '$env/static/public';
import { checkPermissaoRotas } from '$lib/server/sv_uteis';
import { json } from '@sveltejs/kit';

const baseUrl = `${PUBLIC_API_URL}portal_noticias/redessociais/agendamentos`;
const rota = ['/portal_noticias'];

function buildAuthHeaders(locals) {
	return {
		// @ts-ignore
		Authorization: `Bearer ${locals?.info_utili?.jwt_api ?? ''}`,
		'Content-Type': 'application/json'
	};
}

export async function GET({ fetch, locals, url }) {
	if (!checkPermissaoRotas(rota, locals.info_utili.permissoes_rota)) {
		return json({ error: 401, message: 'Não autorizado a aceder a este endpoint' }, { status: 401 });
	}

	const idNoticia = url.searchParams.get('id_noticia');
	const targetUrl = idNoticia ? `${baseUrl}/${idNoticia}` : baseUrl;
	const response = await fetch(targetUrl, {
		headers: buildAuthHeaders(locals)
	});

	const data = await response.json();
	return json(data, { status: response.status });
}

export async function POST({ fetch, locals, request }) {
	if (!checkPermissaoRotas(rota, locals.info_utili.permissoes_rota)) {
		return json({ error: 401, message: 'Não autorizado a aceder a este endpoint' }, { status: 401 });
	}

	const payload = await request.json();

	const response = await fetch(baseUrl, {
		method: 'POST',
		headers: buildAuthHeaders(locals),
		body: JSON.stringify(payload)
	});

	const data = await response.json().catch(() => ({}));
	return json(data, { status: response.status });
}

