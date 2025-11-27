import { PUBLIC_API_URL } from "$env/static/public";
import { checkPermissaoRotas } from "$lib/server/sv_uteis";
import { json } from "@sveltejs/kit";

export async function GET({ url, cookies, fetch, locals }) {

    const permissoes_acesso_rota = ["/portal_noticias"];
    if (!checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)) {
        return json(
            { error: 401, message: "Não autorizado a aceder a este endpoint" },
            { status: 401 }
        );
    }

    const subURL = PUBLIC_API_URL + "portal_noticias/radio_jornal";

    try {
        const response = await fetch(subURL, {
            headers: {
                "Authorization": "Bearer " + (locals?.info_utili.jwt_api),
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Erro ao obter os radios/jornais");
        }

        const data = await response.json();
        return json(data);
    } catch (error) {
        console.error("Erro ao obter os radios/jornais:", error);
        return json(
            { error: 500, message: "Erro ao obter os radios/jornais" },
            { status: 500 }
        );
    }
}

export async function POST({ url, cookies, fetch, locals, request }) {
    const permissoes_acesso_rota = ["/portal_noticias"];

    if (!checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)) {
        return json(
            { error: 401, message: "Não autorizado a aceder a este endpoint" },
            { status: 401 }
        );
    }

    try {
        const subURL = PUBLIC_API_URL + "portal_noticias/radio_jornal";

        const formData = await request.formData();

        const dados = {
            nome: formData.get("nome"),
            email: formData.get("email")
        };

        console.log("Dados do formulário:", dados);

        const response = await fetch(subURL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${locals?.info_utili.jwt_api}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            const responseData = await response.json();
            return json(responseData);
        } else {
            const errorText = await response.text();
            console.error("Falha ao enviar dados:", errorText || response.statusText);
            return json(
                { error: 500, message: "Erro ao processar a solicitação" },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Erro ao processar solicitação:", error);
        return json(
            { error: 500, message: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}

export async function PUT({ url, cookies, fetch, locals, request }) {
    const permissoes_acesso_rota = ["/portal_noticias"];

    if (!checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)) {
        return json(
            { error: 401, message: "Não autorizado a aceder a este endpoint" },
            { status: 401 }
        );
    }

    try {
        const id = url.searchParams.get("id_radio_jornal");
        if (!id) {
            return json(
                { error: 400, message: "ID é obrigatório na URL" },
                { status: 400 }
            );
        }

        const dados = await request.json();

        const dadosComID = { ...dados };

        console.log("Dados enviados:", dadosComID);

        const subURL = `${PUBLIC_API_URL}portal_noticias/radio_jornal/${id}`;

        const response = await fetch(subURL, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${locals?.info_utili.jwt_api}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dadosComID)
        });

        if (response.ok) {
            const responseData = await response.json();
            return json(responseData);
        } else {
            const errorText = await response.text();
            console.error("Falha ao atualizar dados:", errorText || response.statusText);
            return json(
                { error: 500, message: "Erro ao processar a solicitação" },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Erro ao processar solicitação:", error);
        return json(
            { error: 500, message: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}

export async function DELETE({ url, cookies, fetch, locals, request }) {
    const permissoes_acesso_rota = ["/portal_noticias"];

    if (!checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)) {
        return json(
            { error: 401, message: "Não autorizado a aceder a este endpoint" },
            { status: 401 }
        );
    }

    try {
        const id = url.searchParams.get("id_radio_jornal");
        if (!id) {
            return json(
                { error: 400, message: "ID é obrigatório na URL" },
                { status: 400 }
            );
        }

        console.log("ID a ser deletado:", id);

        const subURL = `${PUBLIC_API_URL}portal_noticias/radio_jornal/${id}`;

        const response = await fetch(subURL, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${locals?.info_utili.jwt_api}`
            }
        });

        if (response.ok) {
            const responseData = await response.json();
            return json(responseData);
        } else {
            const errorText = await response.text();
            console.error("Falha ao deletar registro:", errorText || response.statusText);
            return json(
                { error: 500, message: "Erro ao processar a solicitação" },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Erro ao processar solicitação:", error);
        return json(
            { error: 500, message: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
