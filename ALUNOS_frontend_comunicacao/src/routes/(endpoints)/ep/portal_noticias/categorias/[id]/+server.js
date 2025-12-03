import { PUBLIC_API_URL } from '$env/static/public';
import { checkPermissaoRotas } from '$lib/server/sv_uteis';
import { json } from '@sveltejs/kit';

const permissoes_acesso_rota = ['/portal_noticias'];

function notAuthorized() {
	return json(
		{ error: 401, message: 'Não autorizado a aceder a este endpoint' },
		{ status: 401 }
	);
}

export async function PUT({ params, request, fetch, locals }) {
	if (!checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)) {
		return notAuthorized();
	}

	try {
		const payload = await request.json();
		const response = await fetch(
			`${PUBLIC_API_URL}portal_noticias/categorias/${params.id}`,
			{
				method: 'PUT',
				headers: {
					Authorization: 'Bearer ' + locals?.info_utili.jwt_api,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			}
		);

		const data = await response.json();
		return json(data, { status: response.status });
	} catch (error) {
		console.error('Erro ao atualizar categoria:', error);
		return json({ error: 'Erro ao atualizar categoria' }, { status: 500 });
	}
}

export async function DELETE({ params, fetch, locals }) {
	if (!checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)) {
		return notAuthorized();
	}

	try {
		const response = await fetch(
			`${PUBLIC_API_URL}portal_noticias/categorias/${params.id}`,
			{
				method: 'DELETE',
				headers: {
					Authorization: 'Bearer ' + locals?.info_utili.jwt_api,
					'Content-Type': 'application/json'
				}
			}
		);

		if (response.status === 204) {
			return json({}, { status: 204 });
		}

		const data = await response.json();
		return json(data, { status: response.status });
	} catch (error) {
		console.error('Erro ao eliminar categoria:', error);
		return json({ error: 'Erro ao eliminar categoria' }, { status: 500 });
	}
}





