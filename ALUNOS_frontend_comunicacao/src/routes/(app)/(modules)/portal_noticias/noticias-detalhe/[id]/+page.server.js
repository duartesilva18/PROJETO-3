import { makeid } from "$lib/server/sv_uteis";
import { setupTranslations } from "./translations";

/** @type {import('./$types').PageServerLoad} */
export async function load({cookies}) {
    setupTranslations();

    return {
        jwe: {
            data: "aaa"
        },
        jwt_cont: "bbb"
    }
}