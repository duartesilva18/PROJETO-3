import { PUBLIC_API_URL } from "$env/static/public";
import { checkPermissaoRotas } from "$lib/server/sv_uteis";
import { json } from "@sveltejs/kit";

export async function GET({ fetch, locals }) {
  const permissoes_acesso_rota = ["/portal_noticias"];
  if (!checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)) {
    return json(
      { error: 401, message: "Não autorizado a aceder a este endpoint" },
      { status: 401 }
    );
  }

  const subURL = PUBLIC_API_URL + "portal_noticias/noticias";

  const res = await fetch(subURL, {
    headers: {
      // @ts-ignore
      Authorization: "Bearer " + (locals?.info_utili.jwt_api),
      "Content-Type": "application/json",
    },
  });
  const data = await res.json();
  return json(data);
}

export async function POST({ fetch, locals, request }) {
  const permissoes_acesso_rota = ["/portal_noticias"];
  if (!checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)) {
    return json(
      { error: 401, message: "Não autorizado a aceder a este endpoint" },
      { status: 401 }
    );
  }

  try {
    const subURL = PUBLIC_API_URL + "portal_noticias/noticias";

    const formData = await request.formData();

    // Converter FormData em objeto
    const formDataObject = {};
    for (const [key, value] of formData.entries()) {
      if (["tags", "redesSociais", "anexos"].includes(key)) {
        formDataObject[key] = value ? JSON.parse(String(value)) : [];
      } else {
        formDataObject[key] = value;
      }
    }

    // DEBUG: ver o que vai para o Nest
    console.log("Body que vai para /portal_noticias/noticias:", formDataObject);

    if (typeof formDataObject.titulo !== "string" || typeof formDataObject.texto !== "string") {
      return json(
        { error: 400, message: 'Os campos "titulo" e "texto" devem ser strings.' },
        { status: 400 }
      );
    }

    const response = await fetch(subURL, {
      method: "POST",
      headers: {
        // @ts-ignore
        Authorization: "Bearer " + (locals?.info_utili.jwt_api),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formDataObject),
    });

    const rawText = await response.text();

    // DEBUG: resposta crua da API
    console.error(
      "Resposta da API /portal_noticias/noticias:",
      response.status,
      rawText
    );

    if (!response.ok) {
      return json(
        {
          error: true,
          status: response.status,
          message: rawText || response.statusText,
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
    console.error("Erro ao enviar anexos / criar notícia:", error);
    return json({ error: true, message: "Erro interno no proxy" }, { status: 500 });
  }
}

export async function PUT({ url, fetch, locals, request }) {
  const permissoes_acesso_rota = ["/portal_noticias"];
  if (!checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)) {
    return json(
      { error: 401, message: "Não autorizado a aceder a este endpoint" },
      { status: 401 }
    );
  }

  try {
    const dados = await request.json();
    const noticiaId = url.searchParams.get("id_noticia");

    if (!noticiaId) {
      return json(
        { error: 400, message: "ID da notícia não foi fornecido." },
        { status: 400 }
      );
    }

    const subURL = `${PUBLIC_API_URL}portal_noticias/noticias/${noticiaId}`;
    const response = await fetch(subURL, {
      method: "PUT",
      headers: {
        // @ts-ignore
        Authorization: "Bearer " + (locals?.info_utili.jwt_api),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dados),
    });

    const rawText = await response.text();

    if (!response.ok) {
      console.error("Erro da API ao atualizar notícia:", response.status, rawText);
      return json(
        { error: response.status, message: rawText || response.statusText },
        { status: response.status }
      );
    }

    let parsed;
    try {
      parsed = rawText ? JSON.parse(rawText) : {};
    } catch {
      parsed = { message: rawText };
    }

    return json(parsed, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar a notícia:", error);
    return json(
      { error: 500, message: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
