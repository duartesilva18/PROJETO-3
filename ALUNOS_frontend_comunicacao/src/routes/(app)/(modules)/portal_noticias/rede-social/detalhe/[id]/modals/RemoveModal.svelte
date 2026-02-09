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

<div class="modal-backdrop-custom {open ? 'd-flex' : 'd-none'}">
	<div class="modal-card">
		<h5>Eliminar Notícia</h5>
		<p class="modal-text">
			Tem a certeza que quer remover a notícia <strong>"{titulo}"</strong>? Esta ação não pode ser desfeita.
		</p>
		<div class="modal-actions">
			<button type="button" class="btn btn-sm btn-danger" onclick={removeNoticiaService}>
				Eliminar
			</button>
			<button type="button" class="btn btn-sm btn-outline-secondary" onclick={modalClose}>
				Cancelar
			</button>
		</div>
	</div>
</div>

<style>
	.modal-backdrop-custom {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.55);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1050;
	}

	.modal-card {
		background: #fff;
		border-radius: 8px;
		padding: 24px;
		width: min(420px, calc(100% - 32px));
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
	}

	.modal-card h5 {
		font-size: 18px;
		margin-bottom: 12px;
	}

	.modal-text {
		font-size: 14px;
		margin-bottom: 20px;
		color: #4a5568;
	}

	.modal-actions {
		display: flex;
		gap: 12px;
		justify-content: flex-end;
	}
</style>
