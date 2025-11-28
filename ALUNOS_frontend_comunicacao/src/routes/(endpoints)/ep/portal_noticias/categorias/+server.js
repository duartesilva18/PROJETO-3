import { PUBLIC_API_URL } from "$env/static/public";
import { checkPermissaoRotas } from "$lib/server/sv_uteis";
import { json } from "@sveltejs/kit";

const permissoes_acesso_rota = ['/portal_noticias'];
const subURL = PUBLIC_API_URL + 'portal_noticias/categorias';

function notAuthorized() {
	return json(
		{ error: 401, message: 'Não autorizado a aceder a este endpoint' },
		{ status: 401 }
	);
}

export async function GET({ fetch, locals }) {
	if (!checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)) {
		return notAuthorized();
	}

	try {
		const response = await fetch(subURL, {
			headers: {
				Authorization: 'Bearer ' + locals?.info_utili.jwt_api,
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error('Erro ao obter as categorias');
		}

		const data = await response.json();
		return json(data);
	} catch (error) {
		console.error('Erro ao obter as categorias:', error);
		return json({ error: 'Erro ao obter categorias' }, { status: 500 });
	}
}

export async function POST({ request, fetch, locals }) {
	if (!checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)) {
		return notAuthorized();
	}

	try {
		const payload = await request.json();

		const response = await fetch(subURL, {
			method: 'POST',
			headers: {
				Authorization: 'Bearer ' + locals?.info_utili.jwt_api,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		});

		const data = await response.json();
		return json(data, { status: response.status });
	} catch (error) {
		console.error('Erro ao criar categoria:', error);
		return json({ error: 'Erro ao criar categoria' }, { status: 500 });
	}
}
