<script>
	import { preventDefault } from 'svelte/legacy';
	import Breadcrum from '$lib/components/Breadcrum.svelte';
	import { sidebarOptions } from '$lib/runes/sidebarOptions.rune.svelte';
	import { locale, t } from '$lib/translations/translations';
	import { configurePortalSidebar } from '../sidebar.config.js';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';
	import { modalStore } from '$lib/stores/modalStore';
	import RemoveModal from '../noticia/[id]/modals/RemoveModal.svelte';
	import * as dt_pt from '$lib/translations/pt/datatables.json';
	import * as dt_en from '$lib/translations/en/datatables.json';
	import diacriticless from 'diacriticless';
	import toastr from 'toastr';

	const translate = (key) => get(t)(key);
	configurePortalSidebar('midiaList', translate);

	const ESTADO_PENDENTE = 'Pendente';
	const ESTADO_PUBLICADO = 'Publicado';

	let loadingData = $state(true);

	/** @type {RemoveModal} */
	let removeModalBind = $state();

	let formFilter = $state({
		titulo: '',
		estado: ''
	});

	let noticiasDatamedia = [];
	let notData = [];
	let jornais_radios = [];

	let radioTableEl;
	let radioTable;

	function isTipoMedia(noticia) {
		return noticia.tipo === 1;
	}

	function formatDate(dateString) {
		const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
		return new Date(dateString).toLocaleDateString('pt-PT', options);
	}

	function getRadioJornalNames(idsString) {
		if (!idsString) return 'Sem rádios/jornais';

		const ids = idsString.split(',');
		let result = [];

		ids.forEach((id, index) => {
			const radio = jornais_radios.find((r) => r.id_radio_jornal === id);
			if (radio) {
				result.push(`${index + 1} - ${radio.nome}`);
			}
		});

		return result.length > 0 ? result.join(' , ') : 'IDs não encontrados';
	}

	function getRadioJornalnumero(idsString) {
		if (!idsString) return 0;

		const ids = idsString.split(',');
		let aux = 0;

		ids.forEach((id, index) => {
			const radio = jornais_radios.find((r) => r.id_radio_jornal === id);
			if (radio) {
				aux = index + 1;
			}
		});

		return aux;
	}

	function handleSelectMedia(noticia) {
		if (!noticia?.id_noticia) return;
		// abrir página de detalhe, tal como no portal de notícias
		goto(`/portal_noticias/noticia/${noticia.id_noticia}`);
	}

	function createMidia() {
		goto('/portal_noticias/criarmedia');
	}

	function handleEditMidia(noticia) {
		if (!noticia?.id_noticia) return;
		goto(`/portal_noticias/editarmedia/${noticia.id_noticia}`);
	}

	function onHandleSubmit(e) {
		e.preventDefault();
		pesquisarNoticia();
	}

	function pesquisarNoticia() {
		const keyword = diacriticless(formFilter.titulo.toLowerCase().trim());

		let filteredRadioByKeyword = notData;
		if (keyword !== '') {
			filteredRadioByKeyword = notData.filter((noticia) => {
				const tituloWithoutAccents = diacriticless(noticia.titulo.toLowerCase());
				return tituloWithoutAccents.includes(keyword);
			});
		}

		const estadoFilter = formFilter.estado;
		noticiasDatamedia = filteredRadioByKeyword.filter((noticia) => {
			if (estadoFilter === '') return true;
			return noticia.estado === estadoFilter;
		});

		refreshRadioTable();
	}

	// Envia emails de mídia (texto base + imagens associadas via backend)
	async function enviarEmailsParaMidia(noticia) {
		if (!noticia?.id_noticia) return;

		const baseTexto = noticia.texto ?? '';
		const titulo = noticia.titulo ?? '';

		const ids = (noticia.emails ?? '')
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);

		const pedidos = ids.map(async (id) => {
			const radio = jornais_radios.find((r) => String(r.id_radio_jornal) === String(id));
			if (!radio?.email) {
				console.warn('[MIDIA] Rádio/Jornal sem email encontrado', { id, radio });
				return;
			}

			const textoFinal = baseTexto;

			const corpo = {
				email: radio.email,
				assunto: titulo,
				tipo: 'portal_noticias_midia',
				dados_tipo: {
					titulo,
					texto: textoFinal,
					id_noticia: noticia.id_noticia,
					id_radio_jornal: id
				}
			};

			try {
				const resp = await fetch('/ep/notificacao/enviarNotificacaoEmail', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(corpo)
				});

				if (!resp.ok) {
					console.error('[MIDIA] Falha ao criar notificação de email', {
						status: resp.status,
						body: await resp.text().catch(() => null)
					});
				}
			} catch (err) {
				console.error('[MIDIA] Erro na chamada ao endpoint de email', err);
			}
		});

		await Promise.all(pedidos);
	}

	async function publicarMidia(noticia) {
		if (!noticia?.id_noticia) return;
		if (noticia.estado === ESTADO_PUBLICADO) return;

		try {
			console.log('[MIDIA] Publicar mídia clicado', {
				id_noticia: noticia.id_noticia,
				estadoAntes: noticia.estado
			});
			// enviar emails
			await enviarEmailsParaMidia(noticia);

			// atualizar estado para Publicado
			const respStatus = await fetch(
				`/ep/portal_noticias/update_status?id_noticia=${noticia.id_noticia}&status=${ESTADO_PUBLICADO}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json'
					}
				}
			);

			console.log('[MIDIA] Resposta update_status mídia', {
				id_noticia: noticia.id_noticia,
				statusHttp: respStatus.status,
				ok: respStatus.ok
			});

			// atualizar estado local e refrescar tabela
			noticia.estado = ESTADO_PUBLICADO;
			toastr.success('Mídia publicada e emails enviados com sucesso.', 'SUCESSO!', {
				timeOut: 5000,
				progressBar: true
			});
			pesquisarNoticia();
		} catch (e) {
			console.error('Erro ao publicar mídia:', e);
			toastr.error('Erro ao publicar mídia. Por favor contacte os SI.', 'ERRO!', {
				timeOut: 5000,
				progressBar: true
			});
		}
	}

	async function onDeleteRowMidia() {
		const noticias_fetch = await fetch('/ep/portal_noticias/dados').then((d) => d.json());

		noticiasDatamedia = noticias_fetch.filter(
			(n) => n.estado !== 'eliminada' && isTipoMedia(n)
		);
		notData = noticiasDatamedia;

		refreshRadioTable();
	}

	let radioTableColumns = [
		{ title: $t('divNoticias.Assunto'), width: '30%' },
		{
			title: $t('divNoticias.estado'),
			width: '10%',
			render: function (data, type, row) {
				let estado = row[1];
				let estadoClass = '';

				if (estado === ESTADO_PENDENTE) {
					estadoClass = 'estado-pendente';
					estado = 'Rascunho';
				} else if (estado === ESTADO_PUBLICADO) {
					estadoClass = 'estado-publicado';
				}

				return `
				<div class="d-flex justify-content-center">
					<span class="estado ${estadoClass}">
					${estado || 'null'}
					</span>
				</div>
				`;
			}
		},
		{ title: $t('divNoticias.dataCriacao'), width: '20%' },
		{
			title: 'Anexos',
			width: '10%',
			render: function (data, type, row) {
				const anexos = row[3] ?? [];
				const count = Array.isArray(anexos) ? anexos.length : 0;

				let badgeIcon = '';
				let badgeColor = 'badge-secondary';

				if (count > 0) {
					if (count === 1) {
						badgeIcon = `${count}  ${$t('divNoticias.anexo')}`;
						badgeColor = 'badge-success';
					} else {
						badgeIcon = `${count}  ${$t('divNoticias.anexos')}`;
						badgeColor = 'badge-info';
					}
				} else {
					badgeIcon = `${$t('divNoticias.sanexos')}`;
				}

				return `<div class="d-flex justify-content-center">
					<span class="estado ${badgeColor}" style="color: white; width: 60px;">${badgeIcon}</span>
				</div>`;
			}
		},
		{
			title: 'Nome do Rádio / Jornal',
			width: '20%',
			render: function (data, type, row) {
				return row[4] || 'Sem rádios/jornais';
			}
		},
		{
			title: 'Nº rádios/jornais',
			width: '10%',
			render: function (data, type, row) {
				return row[5] ?? 0;
			}
		},
		{
			title: '',
			orderable: false,
			width: '8%',
			render: (data, type, row, meta) => {
				const estado = row[1];
				const isPending = estado === ESTADO_PENDENTE;

				if (isPending) {
					return `
					<div class="d-flex justify-content-center">
						<button
							data-rowindex="${meta.row}"
							class="btn btn-sm btn-outline-primary table_button_edit_midia"
						>
							<i class="fa fa-edit"></i>
						</button>
					</div>`;
				}

				// botão desativado para publicados
				return `
				<div class="d-flex justify-content-center">
					<button
						class="btn btn-sm btn-outline-primary disabled"
						style="cursor: not-allowed; color: #6c757d; border-color: #6c757d; opacity: 0.20;"
						disabled
					>
						<i class="fa fa-edit"></i>
					</button>
				</div>`;
			}
		},
		{
			title: '',
			orderable: false,
			width: '8%',
			render: (data, type, row, meta) => {
				const estado = row[1];
				const isPending = estado === ESTADO_PENDENTE;

				if (isPending) {
					return `
					<div class="d-flex justify-content-center">
						<button
							data-rowindex="${meta.row}"
							class="btn btn-sm btn-outline-danger table_button_delete_midia"
						>
							<i class="fa fa-trash"></i>
						</button>
					</div>`;
				}

				// botão desativado para publicados
				return `
				<div class="d-flex justify-content-center">
					<button
						class="btn btn-sm btn-outline-danger disabled"
						style="cursor: not-allowed; color: #6c757d; border-color: #6c757d; opacity: 0.20;"
						disabled
					>
						<i class="fa fa-trash"></i>
					</button>
				</div>`;
			}
		},
		{
			title: '',
			orderable: false,
			width: '10%',
			render: (data, type, row, meta) => {
				const estado = row[1];
				const isPending = estado === ESTADO_PENDENTE;
				const isPublished = estado === ESTADO_PUBLICADO;
				const publishLabel = 'Publicar';

				if (isPending) {
					// igual ao listar notícias: botão verde de publicar (outline-success)
					return `
					<div class="d-flex justify-content-center">
						<button
							data-rowindex="${meta.row}"
							class="btn btn-sm btn-outline-success table_button_publish_midia"
						>
							<i class="fa fa-share-alt mr-1"></i> ${publishLabel}
						</button>
					</div>`;
				}

				const finalLabel = isPublished ? 'Publicado' : publishLabel;
				const finalIcon = isPublished ? 'fa fa-check mr-1' : 'fa fa-share-alt mr-1';

				// igual ao listar notícias: botão cinzento desativado
				return `
				<div class="d-flex justify-content-center">
					<button
						class="btn btn-sm btn-outline-secondary table_button_publish_midia disabled"
						style="cursor: not-allowed; opacity: 0.4;"
						data-rowindex="${meta.row}"
						disabled
					>
						<i class="${finalIcon}"></i> ${finalLabel}
					</button>
				</div>`;
			}
		}
	];

	onMount(async () => {
		globalThis.$.fn.dataTable.ext.errMode = 'none';

		const [noticias_fetch, radio_jornal_fetch] = await Promise.all([
			fetch('/ep/portal_noticias/dados').then((d) => d.json()),
			fetch('/ep/portal_noticias/radio_jornal').then((d) => d.json())
		]);

		const originalNoticiasData = noticias_fetch;

		// tabela média só tipo 1
		noticiasDatamedia = originalNoticiasData.filter(
			(n) => n.estado !== 'eliminada' && isTipoMedia(n)
		);
		notData = noticiasDatamedia;

		jornais_radios = radio_jornal_fetch;

		radioTable = jQuery(radioTableEl).DataTable({
			dom: 'Bfrtip',
			columns: radioTableColumns,
			responsive: true,
			buttons: ['pageLength', 'pdf', 'csv', 'excel', 'copy', 'colvis'],
			pageLength: 25,
			order: [[1, 'desc']],
			language: locale.get() == 'pt' ? dt_pt : dt_en
		});

		refreshRadioTable();
		loadingData = false;
	});

	function refreshRadioTable() {
		if (!radioTable) return;

		radioTable.clear();

		noticiasDatamedia.forEach((noticia, index) => {
			const rowData = [
				`<div class="clickable-cell2" data-rowindex="${index}">${noticia.titulo}</div>`,
				noticia.estado,
				formatDate(noticia.data_criacao),
				noticia.pn_anexos ?? [],
				getRadioJornalNames(noticia.emails),
				getRadioJornalnumero(noticia.emails)
			];

			radioTable.row.add(rowData).node();
		});

		jQuery(radioTableEl)
			.off('click', '.clickable-cell2')
			.on('click', '.clickable-cell2', function () {
				const rowIndex = jQuery(this).data('rowindex');
				const noticia = noticiasDatamedia[rowIndex];
				handleSelectMedia(noticia);
			})
			.off('click', '.table_button_publish_midia')
			.on('click', '.table_button_publish_midia', function () {
				const rowIndex = jQuery(this).data('rowindex');
				const noticia = noticiasDatamedia[rowIndex];
				publicarMidia(noticia);
			})
			.off('click', '.table_button_edit_midia')
			.on('click', '.table_button_edit_midia', function () {
				const rowIndex = jQuery(this).data('rowindex');
				const noticia = noticiasDatamedia[rowIndex];
				handleEditMidia(noticia);
			})
			.off('click', '.table_button_delete_midia')
			.on('click', '.table_button_delete_midia', function () {
				const rowIndex = jQuery(this).data('rowindex');
				const noticia = noticiasDatamedia[rowIndex];
				const modal = get(modalStore);
				if (modal && modal.onOpenModal) {
					modal.onOpenModal(noticia);
				}
			});

		radioTable.draw();
	}

	let items_breadcrum = $derived([
		{
			icon_class: 'fas fa-plus',
			url: '#',
			designacao: 'Adicionar Mídia',
			function: createMidia
		}
	]);
	</script>

<Breadcrum
	modulo={sidebarOptions.currentModule}
	objeto={sidebarOptions.currentObject}
	menu_items={items_breadcrum}
/>

<div class="tableNews">
	<div class="row filter">
		<form onsubmit={preventDefault(onHandleSubmit)} class="w-100">
			<div class="row filter-row align-items-start g-3">
				<!-- ESTADO -->
				<div class="col-md-3 col-lg-3">
					<label for="estadoInput" class="filter-label">
						{$t('divNoticias.estado')}
					</label>
					<select
						id="estadoInput"
						bind:value={formFilter.estado}
						class="form-control"
					>
						<option value="">{ $t('divNoticias.todos') }</option>
						<option value={ESTADO_PENDENTE}>Rascunho</option>
						<option value={ESTADO_PUBLICADO}>{ $t('divNoticias.publicado') }</option>
					</select>
				</div>

				<!-- BOTÃO PESQUISAR, À DIREITA -->
				<div class="col-md-3 col-lg-3 d-flex flex-column align-items-center align-items-md-start">
					<span class="filter-label d-block">&nbsp;</span>
					<button
						type="submit"
						class="btn btn-primary btn-sm filter-submit"
						style="margin-top: 0px; background-color: #00a4e6; border-color: #00a4e6;"
						aria-label={$t('divNoticias.btPesquisar')}
					>
						<i class="fas fa-search"></i>
					</button>
				</div>
			</div>
		</form>
	</div>

	<div id="radioTable">
		<div class="table-responsive">
			<table
				bind:this={radioTableEl}
				class="datatable-on table-striped hover datatable table-sm nowrap no-footer dtr-inline"
			></table>
		</div>
		{#if loadingData}
			<div id="loading_area">
				<div id="loading-on">
					<span class="dot-on">.</span>
					<span class="dot-on2">.</span>
					<span class="dot-on3">.</span>
				</div>
			</div>
		{/if}
	</div>
</div>

<RemoveModal bind:this={removeModalBind} on:refreshData={onDeleteRowMidia} />

<style>
	@import '../portal_noticias.css';

	/* mesma barra de filtros da página principal */
	.row.filter {
		border-bottom: 1px solid #dde3ea;
		padding: 8px 24px 10px;
	}

	.filter-label {
		display: block;
		margin-bottom: 3px;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #7fa0b5;
	}

	.filter-row .form-control {
		height: 34px;
		font-size: 13px;
		border-radius: 2px;
		border: 1px solid #cfd6dd;
		box-shadow: none;
	}

	.filter-submit {
		height: 34px;
		min-width: 90px;
		padding: 0 80px;
		border-radius: 4px;
		background-color: #00a4e6;
		border-color: #00a4e6;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin-top: -100px;
	}

	.filter-submit i {
		font-size: 15px;
	}
</style>


