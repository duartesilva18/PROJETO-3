import { PUBLIC_API_URL } from "$env/static/public";
import { checkPermissaoRotas } from "$lib/server/sv_uteis";
import { json } from "@sveltejs/kit";

export async function POST({url, cookies, fetch, locals, request}) {

    const permissoes_acesso_rota = ["/portal_noticias"];
    if(!checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)){
        return json({error: 401, message: "Não autorizado a aceder a este endpoint"}, {status: 401});
    }

    try {
        const subURL = PUBLIC_API_URL + 'portal_noticias/anexos/upload';
        // Crie um objeto FormData para enviar os anexos
        
        let formData = await request.formData()
        console.log(formData)
        // Envie a solicitação POST para o backend
        const response = await fetch(subURL, {
            method: 'POST',
            body: formData,
            headers: {
                // @ts-ignore
                "Authorization": "Bearer " + (locals?.info_utili.jwt_api),
                //'Content-Type': 'application/json'
            }
        });
        
        // Verifique se a solicitação foi bem-sucedida
        if (response.ok) {
            const responseData = await response.json();

            // Retornar os anexos da resposta
            return json(responseData.data); // Aqui está a mudança
        } else {
            const errorText = await response.text();
            console.error('Falha ao enviar anexos:', errorText || response.statusText);
        }
    } catch (error) {
        console.error('Erro ao enviar anexos:', error);
    }
}