import { PUBLIC_API_URL } from "$env/static/public";
import { checkPermissaoRotas } from "$lib/server/sv_uteis";
import { json } from "@sveltejs/kit";

export async function GET({ url, cookies, fetch, locals }) {
    // Para aceder a esta rota, é necessária uma das seguintes permissões:
    const permissoes_acesso_rota = ["/portal_noticias"];
    if (!checkPermissaoRotas(permissoes_acesso_rota, locals.info_utili.permissoes_rota)) {
        return json({ error: 401, message: "Não autorizado a aceder a este endpoint" }, { status: 401 });
    }

    return json([
        {
            "id": 1,
            "id_requerente": "utilizador1",
            "id_unidade": 7,
            "assunto": "Pedido de Teste para Arranque do Módulo de Comunicação",
            "descricao": "É um facto estabelecido de que um leitor é distraído pelo conteúdo legível de uma página quando analisa a sua mancha gráfica. Logo, o uso de Lorem Ipsum leva a uma distribuição mais ou menos normal de letras, ao contrário do uso de &quot;Conteúdo aqui, conteúdo aqui&quot;, tornando-o texto legível. Muitas ferramentas de publicação electrónica e editores de páginas web usam actualmente o Lorem Ipsum como o modelo de texto usado por omissão, e uma pesquisa por &quot;lorem ipsum&quot; irá encontrar muitos websites ainda na sua infância. Várias versões têm evoluído ao longo dos anos, por vezes por acidente, por vezes propositadamente (como no caso do humor).",
            "data_proposta_entrega": "2017-03-31T00:00:00.000Z",
            "data_efetiva_entrega": "2017-03-17T00:00:00.000Z",
            "execucao": 1,
            "data_pedido": "2017-03-16T13:55:28.540Z",
            "id_estado": 7,
            "id_responsavel_aprova": "utilizadorgci",
            "data_aprovacao": "2017-03-16T15:02:33.090Z",
            "justificacao": "",
            "data_conclusao": "2017-03-16T15:02:33.900Z",
            "id_projeto": null,
            "projeto_financiado": null
        },
        {
            "id": 3,
            "id_requerente": "utilizadorgci",
            "id_unidade": 6,
            "assunto": "jornadas de mecânica",
            "descricao": "cobertura total",
            "data_proposta_entrega": "2017-03-21T00:00:00.000Z",
            "data_efetiva_entrega": "2017-03-21T00:00:00.000Z",
            "execucao": 1,
            "data_pedido": "2017-03-16T17:03:18.630Z",
            "id_estado": 7,
            "id_responsavel_aprova": "utilizadorgci",
            "data_aprovacao": "2017-03-16T17:11:13.050Z",
            "justificacao": "",
            "data_conclusao": "2017-05-18T11:42:16.996Z",
            "id_projeto": null,
            "projeto_financiado": null
        }
    ]);
}