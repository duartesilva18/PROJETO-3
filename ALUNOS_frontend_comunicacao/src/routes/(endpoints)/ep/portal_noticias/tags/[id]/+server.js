import { PUBLIC_API_URL } from '$env/static/public';
import { checkPermissaoRotas } from '$lib/server/sv_uteis';
import { json } from '@sveltejs/kit';

const permissoes_acesso_rota = ['/portal_noticias'];

export async function PUT({ params, request, fetch, locals }) {
	if (!checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)) {
		return json({ error: 401, message: 'Não autorizado a aceder a este endpoint' }, { status: 401 });
	}

	const payload = await request.json();

	try {
		const response = await fetch(`${PUBLIC_API_URL}portal_noticias/tags/${params.id}`, {
			method: 'PUT',
			headers: {
				Authorization: 'Bearer ' + locals?.info_utili.jwt_api,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			throw new Error('Erro ao atualizar tag');
		}

		const data = await response.json();
		return json(data);
	} catch (error) {
		console.error('Erro ao atualizar tag:', error);
		return json({ error: 'Erro ao atualizar tag' }, { status: 500 });
	}
}

export async function DELETE({ params, fetch, locals }) {
	if (!checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)) {
		return json({ error: 401, message: 'Não autorizado a aceder a este endpoint' }, { status: 401 });
	}

	try {
		const response = await fetch(`${PUBLIC_API_URL}portal_noticias/tags/${params.id}`, {
			method: 'DELETE',
			headers: {
				Authorization: 'Bearer ' + locals?.info_utili.jwt_api
			}
		});

		if (!response.ok) {
			throw new Error('Erro ao eliminar tag');
		}

		return json({ message: 'Tag eliminada com sucesso' });
	} catch (error) {
		console.error('Erro ao eliminar tag:', error);
		return json({ error: 'Erro ao eliminar tag' }, { status: 500 });
	}
}




