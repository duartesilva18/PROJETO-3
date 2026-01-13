<script>
	import { createEventDispatcher } from 'svelte';
	import { modalStore } from '$lib/stores/modalStore';
	import { t } from '$lib/translations/translations';
	import { onMount, onDestroy } from 'svelte';
	import toastr from 'toastr';

	/** @type {{noticiaSelecionada?: any}} */
	let { noticiaSelecionada = {} } = $props();
	let noticiaId = $state(null);
	let titulo = $state('');
	let open = $state(false);

	const dispatch = createEventDispatcher();

	export async function onOpenModal(noticia) {
		noticiaId = noticia?.id_noticia;
		if (noticia) {
			titulo = noticia.titulo || '';
			open = true;
		}
	}

	function modalClose() {
		open = false;
	}

	async function removeNoticiaService() {
		try {
			const response = await fetch(`/ep/portal_noticias/noticia?id=${noticiaId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				toastr.success('Removeu a notícia com sucesso!', 'SUCESSO!', {
					timeOut: 5000,
					progressBar: true
				});
				modalClose();
				dispatch('refreshData');
			} else {
				toastr.error('Erro ao remover a notícia', 'ERRO!', {
					timeOut: 5000,
					progressBar: true
				});
			}
		} catch (error) {
			console.error('Erro ao remover notícia:', error);
			toastr.error('Erro ao remover a notícia', 'ERRO!', {
				timeOut: 5000,
				progressBar: true
			});
		}
	}

	// Define a referência ao store quando o componente é montado
	onMount(() => {
		modalStore.set({
			onOpenModal: onOpenModal
		});
	});

	// Limpa a referência ao store quando o componente é desmontado
	onDestroy(() => {
		modalStore.set(null);
	});
</script>

<div
	class="modal {open ? 'd-block' : 'd-none'}"
	id="removeModal"
	tabindex="-1"
	role="dialog"
	aria-labelledby="removeModalLabel"
	aria-hidden={!open}
>
	<div class="modal-dialog" role="document">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title" id="removeModalLabel">Eliminar Notícia</h5>
				<button
					type="button"
					class="close"
					aria-label="{$t('modal.actions.close')}"
					onclick={modalClose}
				>
					<span aria-hidden="true">&times;</span>
				</button>
			</div>
			<div class="modal-body">
				<p>
					Tem a certeza que quer remover a notícia <strong>"{titulo}"</strong>?
				</p>
				<p class="text-muted mb-0">
					<small>Este processo é irreversível!</small>
				</p>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary" onclick={modalClose}>
					{$t('modal.actions.no')}
				</button>
				<button type="button" class="btn btn-danger" onclick={removeNoticiaService}>
					Eliminar
				</button>
			</div>
		</div>
	</div>
</div>
{#if open}
	<div class="modal-backdrop show d-block"></div>
{/if}

<style>
	.modal-body {
		padding: 1.5rem;
	}

	.modal-body p {
		margin-bottom: 0.5rem;
	}
</style>
