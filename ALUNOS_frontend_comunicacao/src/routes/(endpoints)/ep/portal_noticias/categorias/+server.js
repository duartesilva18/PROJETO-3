import { PUBLIC_API_URL } from "$env/static/public";
import { checkPermissaoRotas } from "$lib/server/sv_uteis";
import { json } from "@sveltejs/kit";

const permissoes_acesso_rota = ["/portal_noticias"];

function isAuthorized(locals) {
	return (
		locals?.info_utili?.permissoes_rota &&
		checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)
	);
}

async function forwardRequest(fetchFn, locals, { method = 'GET', path = '', body }) {
	const subURL = `${PUBLIC_API_URL}portal_noticias/categorias${path}`;
	const response = await fetchFn(subURL, {
		method,
		headers: {
			Authorization: 'Bearer ' + locals?.info_utili?.jwt_api,
			'Content-Type': 'application/json'
		},
		body: body ? JSON.stringify(body) : undefined
	});

	let data = null;
	try {
		data = await response.json();
	} catch (error) {
		data = null;
	}

	if (!response.ok) {
		return json(data ?? { message: 'Erro no pedido' }, { status: response.status });
	}

	return json(data ?? {});
}

export async function GET({ fetch, locals }) {
	if (!isAuthorized(locals)) {
		return json(
			{ error: 401, message: 'Não autorizado a aceder a este endpoint' },
			{ status: 401 }
		);
	}

	try {
		return await forwardRequest(fetch, locals, { method: 'GET' });
	} catch (error) {
		console.error('Erro ao obter as categorias:', error);
		return json({ error: 'Erro ao obter categorias' }, { status: 500 });
	}
}

export async function POST({ request, fetch, locals }) {
	if (!isAuthorized(locals)) {
		return json(
			{ error: 401, message: 'Não autorizado a aceder a este endpoint' },
			{ status: 401 }
		);
	}

	try {
		const body = await request.json();
		const payload = {
			nome: body?.nome?.trim(),
			descricao: body?.descricao ?? '',
			status: body?.status ?? 'Ativo'
		};

		return await forwardRequest(fetch, locals, { method: 'POST', body: payload });
	} catch (error) {
		console.error('Erro ao criar categoria:', error);
		return json({ error: 'Erro ao criar categoria' }, { status: 500 });
	}
}
