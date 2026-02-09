import { setupTranslations } from "../../translations";

/** @type {import('./$types').PageServerLoad} */
export async function load() {
    setupTranslations();

    return {
        // Dados vazios apenas para satisfazer o load e garantir as traduções
    }
}












