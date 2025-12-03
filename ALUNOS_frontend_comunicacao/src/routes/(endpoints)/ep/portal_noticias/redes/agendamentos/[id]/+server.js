import { PUBLIC_API_URL } from '$env/static/public';
import { checkPermissaoRotas } from '$lib/server/sv_uteis';
import { json } from '@sveltejs/kit';

const rota = ['/portal_noticias'];

function buildAuthHeaders(locals) {
	return {
		// @ts-ignore
		Authorization: `Bearer ${locals?.info_utili?.jwt_api ?? ''}`,
		'Content-Type': 'application/json'
	};
}

export async function PUT({ params, fetch, locals, request }) {
	if (!checkPermissaoRotas(rota, locals.info_utili.permissoes_rota)) {
		return json({ error: 401, message: 'Não autorizado a aceder a este endpoint' }, { status: 401 });
	}

	const payload = await request.json();
	const targetUrl = `${PUBLIC_API_URL}portal_noticias/redessociais/agendamentos/${params.id}`;

	const response = await fetch(targetUrl, {
		method: 'PUT',
		headers: buildAuthHeaders(locals),
		body: JSON.stringify(payload)
	});

	const data = await response.json().catch(() => ({}));
	return json(data, { status: response.status });
}

export async function DELETE({ params, fetch, locals }) {
	if (!checkPermissaoRotas(rota, locals.info_utili.permissoes_rota)) {
		return json({ error: 401, message: 'Não autorizado a aceder a este endpoint' }, { status: 401 });
	}

	const targetUrl = `${PUBLIC_API_URL}portal_noticias/redessociais/agendamentos/${params.id}`;

	const response = await fetch(targetUrl, {
		method: 'DELETE',
		headers: buildAuthHeaders(locals)
	});

	const data = await response.json().catch(() => ({}));
	return json(data, { status: response.status });
}

