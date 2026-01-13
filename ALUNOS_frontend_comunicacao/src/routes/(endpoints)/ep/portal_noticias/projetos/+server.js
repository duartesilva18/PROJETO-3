import { PUBLIC_API_URL } from '$env/static/public';
import { checkPermissaoRotas } from '$lib/server/sv_uteis';
import { json } from '@sveltejs/kit';

const PERMISSOES = ['/portal_noticias'];

function naoAutorizado(locals) {
	return !checkPermissaoRotas(PERMISSOES, locals.info_utili.permissoes_rota);
}

export async function GET({ fetch, locals }) {
	if (naoAutorizado(locals)) {
		return json({ error: 401, message: 'Não autorizado a aceder a este endpoint' }, { status: 401 });
	}

	const subURL = PUBLIC_API_URL + 'portal_noticias/projetos';
	const res = await fetch(subURL, {
		headers: {
			Authorization: 'Bearer ' + locals?.info_utili.jwt_api,
			'Content-Type': 'application/json'
		}
	});

	if (!res.ok) {
		const body = await res.text().catch(() => res.statusText);
		return json({ error: true, message: body }, { status: res.status });
	}

	return json(await res.json());
}

export async function POST({ fetch, locals, request }) {
	if (naoAutorizado(locals)) {
		return json({ error: 401, message: 'Não autorizado a aceder a este endpoint' }, { status: 401 });
	}

	const payload = await request.json();
	const subURL = PUBLIC_API_URL + 'portal_noticias/projetos';
	const res = await fetch(subURL, {
		method: 'POST',
		headers: {
			Authorization: 'Bearer ' + locals?.info_utili.jwt_api,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(payload)
	});

	const body = await res.text();
	if (!res.ok) {
		return json(body ? JSON.parse(body) : { error: true }, { status: res.status });
	}
	return json(body ? JSON.parse(body) : {});
}

export async function PUT({ fetch, locals, request, url }) {
	if (naoAutorizado(locals)) {
		return json({ error: 401, message: 'Não autorizado a aceder a este endpoint' }, { status: 401 });
	}

	const payload = await request.json();
	const id = url.searchParams.get('id');
	const subURL = `${PUBLIC_API_URL}portal_noticias/projetos/${id}`;
	const res = await fetch(subURL, {
		method: 'PUT',
		headers: {
			Authorization: 'Bearer ' + locals?.info_utili.jwt_api,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(payload)
	});

	const body = await res.text();
	if (!res.ok) {
		return json(body ? JSON.parse(body) : { error: true }, { status: res.status });
	}
	return json(body ? JSON.parse(body) : {});
}

export async function DELETE({ fetch, locals, url }) {
	if (naoAutorizado(locals)) {
		return json({ error: 401, message: 'Não autorizado a aceder a este endpoint' }, { status: 401 });
	}

	const id = url.searchParams.get('id');
	const subURL = `${PUBLIC_API_URL}portal_noticias/projetos/${id}`;
	const res = await fetch(subURL, {
		method: 'DELETE',
		headers: {
			Authorization: 'Bearer ' + locals?.info_utili.jwt_api,
			'Content-Type': 'application/json'
		}
	});

	const body = await res.text();
	if (!res.ok) {
		return json(body ? JSON.parse(body) : { error: true }, { status: res.status });
	}
	return json(body ? JSON.parse(body) : {});
}

