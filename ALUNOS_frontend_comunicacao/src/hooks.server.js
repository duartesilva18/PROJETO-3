process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import JWESession from '$lib/server/jwe_session';
import { PUBLIC_API_URL } from '$env/static/public';
import { error, redirect } from '@sveltejs/kit';
import { DO_PERMISSION_CHECKS } from '$env/static/private';

let dados_login = {
    id_utilizador: 'dev',
    pass: '12345',
    email: 'dev@ipvc.pt',
    nome: 'Developer Teste',
    uo: 'ESTG',
    num: '90000'
};

export function handleError({ event, error }) {
    /** @type {any} */
    const err = error;

    if (err.status == 307) {
        redirect(307, err.location);
    }

    if (err.status == 404) {
        return {
            message: 'A página que procura não existe!',
            code: '404'
        };
    }

    console.log(err.message, err.stack, err.status);
    console.log('==== ERRO =====');
    console.log(err);
    console.log('==== EVENTO =====');
    console.log(event);
    console.log('==== ======== =====');
    console.log('Data-hora: ' + new Date());
    console.log('==== FIM ERRO =====\n');

    return {
        message:
            'Ocorreu um erro. Poderão estar a ser feitas atualizações. Se o problema persistir, contacte os SI.',
        code: '500'
    };
}

/**
 * Rotas acessíveis sem login
 * @type {string[]}
 */
const rotas_publicas = [];

/**
 * Rotas não acessíveis com login
 * @type {string[]}
 */
const rotas_bloqueadas_com_login = ['/sem_login', '/login'];

async function loginNaAPI() {
    let key = null;
    try {
        const res = await fetch(PUBLIC_API_URL + 'auth/signIn', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_utilizador: dados_login.id_utilizador,
                password: dados_login.pass
            })
        });

        const item = await res.json();
        if (!item || !item.hasOwnProperty('access_token')) {
            console.log(item);
            throw error(500, { message: 'Problema a obter a Token da API.' });
        }

        key = item.access_token;
    } catch (e) {
        console.error(e);
        throw error(500, {
            message:
                'Problema no acesso à API! Provavelmente estão a ser realizadas atualizações.'
        });
    }

    return key;
}

/** @type {import('@sveltejs/kit').Handle} */
export const handle = async ({ event, resolve }) => {
    // garantir estrutura base de locals
    if (!event.locals.info_utili) {
        event.locals.info_utili = {
            id_utilizador: null,
            nome: null,
            email: null,
            jwt_api: null,
            permissoes_rota: []
        };
    }

    if (!event.url.pathname.startsWith('/ch/')) console.log(event.url.pathname);

    const jwecookie = event.cookies.get('AuthorizationToken');

    if (jwecookie) {
        const token = jwecookie.split(' ')[1];

        /** @type {any} */
        const jwt = await new JWESession().decrypJWE(token);

        if (jwt.payload && !jwt.errcode) {
            /** @type {any} */
            const payload = jwt.payload || {};

            event.locals.info_utili = {
                id_utilizador: dados_login.id_utilizador,
                nome: dados_login.nome,
                email: dados_login.email,
                jwt_api: null,
                permissoes_rota: payload.permissoes_rota ?? []
            };

            // @ts-ignore
            event.locals.on_p_key = payload.on_user_key;

            if (
                !rotas_publicas.includes(event.url.pathname) &&
                !event.url.pathname.startsWith('/ch/')
            ) {
                if (!payload.jwt_api) {
                    console.log('[!] Requesting API KEY');
                    payload.jwt_api = await loginNaAPI();

                    const novoToken = await new JWESession().createJWE(payload);
                    event.cookies.set('AuthorizationToken', 'Bearer ' + novoToken, {
                        path: '/'
                    });
                }

                if (payload.jwt_api) {
                    event.locals.info_utili.jwt_api = payload.jwt_api;
                }
            }
        } else {
            // JWE inválida – limpar e recriar
            event.cookies.delete('AuthorizationToken', { path: '/' });

            const dados = {
                id_utilizador: dados_login.id_utilizador,
                email: dados_login.email,
                nome: dados_login.nome,
                num: dados_login.num,
                uo: dados_login.uo
            };

            const jwe = await new JWESession().createJWE(dados);
            /** @type {any} */
            const jwt_novo = await new JWESession().decrypJWE(jwe);
            const payload_novo = jwt_novo.payload || {};

            payload_novo.jwt_api = await loginNaAPI();

            const novoToken = await new JWESession().createJWE(payload_novo);
            event.cookies.set('AuthorizationToken', 'Bearer ' + novoToken, {
                path: '/'
            });

            event.locals.info_utili = {
                id_utilizador: dados_login.id_utilizador,
                nome: dados_login.nome,
                email: dados_login.email,
                jwt_api: payload_novo.jwt_api,
                permissoes_rota: payload_novo.permissoes_rota ?? []
            };
        }
    } else {
        // primeira vez sem JWE
        const dados = {
            id_utilizador: dados_login.id_utilizador,
            email: dados_login.email,
            nome: dados_login.nome,
            num: dados_login.num,
            uo: dados_login.uo
        };

        const jwe = await new JWESession().createJWE(dados);
        /** @type {any} */
        const jwt = await new JWESession().decrypJWE(jwe);
        const payload = jwt.payload || {};

        payload.jwt_api = await loginNaAPI();

        const novoToken = await new JWESession().createJWE(payload);
        event.cookies.set('AuthorizationToken', 'Bearer ' + novoToken, {
            path: '/'
        });

        event.locals.info_utili = {
            id_utilizador: dados_login.id_utilizador,
            nome: dados_login.nome,
            email: dados_login.email,
            jwt_api: payload.jwt_api,
            permissoes_rota: payload.permissoes_rota ?? []
        };
    }

    return await resolve(event);
};
