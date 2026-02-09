import { setupTranslations } from "../translations";

/** @type {import('./$types').PageServerLoad} */
export async function load() {
    setupTranslations();
    return {};
}












