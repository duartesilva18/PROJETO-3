<script>
import { browser } from "$app/environment";
import { goto } from "$app/navigation";
import { redirect } from "@sveltejs/kit";

// Ao entrar no layout (app), ir logo para o Portal de Notícias
if (browser) {
  goto('/portal_noticias');
} else {
  redirect(307, "/portal_noticias");
}
</script>