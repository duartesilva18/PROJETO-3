import { PUBLIC_API_URL } from '$env/static/public';
import { checkPermissaoRotas } from '$lib/server/sv_uteis';
import { json } from '@sveltejs/kit';

const permissoes_acesso_rota = ['/portal_noticias'];

function isAuthorized(locals) {
	return (
		locals?.info_utili?.permissoes_rota &&
		checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)
	);
}

async function forwardRequest(fetchFn, locals, { method, path, body }) {
	const subURL = `${PUBLIC_API_URL}portal_noticias/categorias/${path}`;
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

export async function PUT({ params, request, fetch, locals }) {
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

		return await forwardRequest(fetch, locals, {
			method: 'PUT',
			path: params.id,
			body: payload
		});
	} catch (error) {
		console.error('Erro ao atualizar categoria:', error);
		return json({ error: 'Erro ao atualizar categoria' }, { status: 500 });
	}
}

export async function DELETE({ params, fetch, locals }) {
	if (!isAuthorized(locals)) {
		return json(
			{ error: 401, message: 'Não autorizado a aceder a este endpoint' },
			{ status: 401 }
		);
	}

	try {
		return await forwardRequest(fetch, locals, {
			method: 'DELETE',
			path: params.id
		});
	} catch (error) {
		console.error('Erro ao apagar categoria:', error);
		return json({ error: 'Erro ao apagar categoria' }, { status: 500 });
	}
}

