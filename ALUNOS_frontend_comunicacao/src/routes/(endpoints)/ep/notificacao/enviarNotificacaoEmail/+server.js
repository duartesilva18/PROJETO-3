import { PUBLIC_API_URL } from '$env/static/public';
import { json } from '@sveltejs/kit';

export async function POST({ fetch, request, locals }) {
  try {
    const subURL = PUBLIC_API_URL + 'notificacao/enviarNotificacaoEmail';
    const body = await request.json();

    console.log('[EP/notificacao] Proxy enviarNotificacaoEmail body =>', body);

    const response = await fetch(subURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // @ts-ignore
        Authorization: 'Bearer ' + (locals?.info_utili?.jwt_api ?? '')
      },
      body: JSON.stringify(body)
    });

    const rawText = await response.text();

    if (!response.ok) {
      console.error(
        '[EP/notificacao] Erro da API enviarNotificacaoEmail:',
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
    console.error('[EP/notificacao] Erro no proxy enviarNotificacaoEmail:', error);
    return json({ error: true, message: 'Erro interno no proxy' }, { status: 500 });
  }
}


