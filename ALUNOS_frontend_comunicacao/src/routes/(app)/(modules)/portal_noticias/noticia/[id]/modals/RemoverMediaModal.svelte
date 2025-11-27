<script>
    import { createEventDispatcher } from 'svelte';
    import { modalStore } from '$lib/stores/modalStore';
    //import { DeleteNoticia } from '$lib/ep/noticiasv2/fetch_page/+page.js';
    import { onMount, onDestroy} from 'svelte';

    /** @type {{mediaSelecionada?: any}} */
    let { mediaSelecionada = {} } = $props();
    let mediaID;
    let titulo = $state("");

    const dispatch = createEventDispatcher();

    export async function onOpenModal(radio) {
        mediaID = radio?.id_radio_jornal;
        if (mediaSelecionada) {
            titulo = radio.nome;
            // Mostrar o modal
            jQuery('#removeModal').modal('show');
        }
    }

    async function removerMediaService() {
        await DeleteMedia(mediaID);
        toastr.success('Removeu a noticia com sucesso!','SUCESSO!',{ timeOut: 5000, progressBar: true})
        closeModal();
    }

    function closeModal() {
        dispatch('refreshData');
        jQuery('#removeModal').modal('hide');
    }

    async function DeleteMedia(id_radio_jornal){
        let delete_noticia = await fetch(`/ep/portal_noticias/radio_jornal?id_radio_jornal=${id_radio_jornal}`,{
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
                Tem a certeza que quer remover este Radio/Jornal? Este processo é irrevertível!
            </div>
            <div class="modal-footer col-12">
                <div class="col-6">
                    <button type="button" class="btn btn-danger" onclick={removerMediaService}>Remover Radio/Jornal</button>
                </div>
                <div class="col-6 text-right">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                </div>
            </div>            
        </div>
    </div>
</div>
