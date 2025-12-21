import { PUBLIC_API_URL } from '$env/static/public';
import { checkPermissaoRotas } from '$lib/server/sv_uteis';
import { json } from '@sveltejs/kit';

const permissoes_acesso_rota = ['/portal_noticias'];

export async function GET({ fetch, locals, url }) {
  if (!checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)) {
    return json(
      { error: 401, message: 'Não autorizado a aceder a este endpoint' },
      { status: 401 }
    );
  }

  const id_noticia = url.pathname.split('/').pop() || '';

  if (!id_noticia) {
    return json({ error: 400, message: 'id_noticia em falta' }, { status: 400 });
  }

  const subURL = `${PUBLIC_API_URL}portal_noticias/midia_anexos/${id_noticia}`;

  try {
    const response = await fetch(subURL, {
      headers: {
        // @ts-ignore
        Authorization: 'Bearer ' + (locals?.info_utili.jwt_api),
        'Content-Type': 'application/json'
      }
    });

    const rawText = await response.text();

    if (!response.ok) {
      console.error(
        '[EP/midia_anexos][GET] Erro da API:',
        response.status,
        rawText
      );
      return json(
        {
          error: true,
          status: response.status,
          message: rawText || response.statusText
        },
        { status: response.status }
      );
    }

    let parsed;
    try {
      parsed = rawText ? JSON.parse(rawText) : [];
    } catch {
      parsed = [];
    }

    return json(parsed);
  } catch (error) {
    console.error('[EP/midia_anexos][GET] Erro no proxy:', error);
    return json({ error: true, message: 'Erro interno no proxy' }, { status: 500 });
  }
}

export async function POST({ fetch, locals, request }) {
  if (!checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)) {
    return json(
      { error: 401, message: 'Não autorizado a aceder a este endpoint' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const subURL = `${PUBLIC_API_URL}portal_noticias/midia_anexos`;

    console.log('[EP/midia_anexos][POST] Body =>', body);

    const response = await fetch(subURL, {
      method: 'POST',
      headers: {
        // @ts-ignore
        Authorization: 'Bearer ' + (locals?.info_utili.jwt_api),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const rawText = await response.text();

    if (!response.ok) {
      console.error(
        '[EP/midia_anexos][POST] Erro da API:',
        response.status,
        rawText
      );
      return json(
        {
          error: true,
          status: response.status,
          message: rawText || response.statusText
        },
        { status: response.status }
      );
    }

    let parsed;
    try {
      parsed = rawText ? JSON.parse(rawText) : {};
    } catch {
      parsed = { message: rawText };
    }

    return json(parsed);
  } catch (error) {
    console.error('[EP/midia_anexos][POST] Erro no proxy:', error);
    return json({ error: true, message: 'Erro interno no proxy' }, { status: 500 });
  }
}


