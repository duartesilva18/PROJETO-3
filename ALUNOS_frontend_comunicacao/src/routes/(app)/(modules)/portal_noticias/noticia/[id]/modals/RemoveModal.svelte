<script>
    import { createEventDispatcher } from 'svelte';
    import { modalStore } from '$lib/stores/modalStore';
    //import { DeleteNoticia } from '$lib/ep/noticiasv2/fetch_page/+page.js';
    import { onMount, onDestroy} from 'svelte';

    /** @type {{noticiaSelecionada?: any}} */
    let { noticiaSelecionada = {} } = $props();
    let noticiaId;
    let titulo = $state("");

    const dispatch = createEventDispatcher();

    export async function onOpenModal(noticia) {
        noticiaId = noticia?.id_noticia;
        if (noticiaSelecionada) {
            titulo = noticia.titulo;
            // Mostrar o modal
            jQuery('#removeModal').modal('show');
        }
    }

    async function removeNoticiaService() {
        await DeleteNoticia(noticiaId);
        toastr.success('Removeu a noticia com sucesso!','SUCESSO!',{ timeOut: 5000, progressBar: true})
        closeModal();
    }

    function closeModal() {
        dispatch('refreshData');
        jQuery('#removeModal').modal('hide');
    }

    async function DeleteNoticia(id_noticia){
        let delete_noticia = await fetch(`/ep/portal_noticias/noticia?id=${id_noticia}`,{
            method: "DELETE"
        })
    }

    // Define a referência ao store quando o componente é montado
    onMount(() => {
        modalStore.set({
            onOpenModal: onOpenModal,
        });
    });

    // Limpa a referência ao store quando o componente é desmontado
    onDestroy(() => {
        modalStore.set(null);
    });
</script>

<div class="modal fade" id="removeModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-sm" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="exampleModalLabel">{titulo}</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                Tem a certeza que quer remover a Noticia? Este processo é irrevertível!
            </div>
            <div class="modal-footer col-12">
                <div class="col-6">
                    <button type="button" class="btn btn-danger" onclick={removeNoticiaService}>Remover Notícia</button>
                </div>
                <div class="col-6 text-right">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                </div>
            </div>            
        </div>
    </div>
</div>
