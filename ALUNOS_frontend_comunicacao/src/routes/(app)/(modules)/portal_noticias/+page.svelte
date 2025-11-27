<script>
import { run } from 'svelte/legacy';
	import { modalStore } from '$lib/stores/modalStore';

import Breadcrum from '$lib/components/Breadcrum.svelte';
import { locale, t } from '$lib/translations/translations';
import RemoveModal from './noticia/[id]/modals/RemoveModal.svelte';
import { configurePortalSidebar } from './sidebar.config.js';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	import { get } from 'svelte/store';
	import * as dt_pt from '$lib/translations/pt/datatables.json';
	import * as dt_en from '$lib/translations/en/datatables.json';

import diacriticless from 'diacriticless';

const translate = (key) => get(t)(key);
configurePortalSidebar('dashboard', translate);

const breadcrumModuleName = 'Gestão de Notícias';
const breadcrumPageName = 'Portal de Notícias';

	/** @type {RemoveModal} */
	let removeModalBind = $state();

	let loadingData = $state(true);

	let formFilter = $state({
		titulo: '',
		categoria: '',
		estado: ''
	});

	let noticiasData = [];
	let notData = [];
	let jornais_radios = [];
	let noticiasDatamedia = notData;

	let categorias = $state([]);
	let originalNoticiasData = [];
	let noticiaSelecionada = {};
	let filteredNoticias = noticiasData;

	let radioTableEl;
	let radioTable;

	let isToggled = true; // true = tabela rádios, false = tabela normal
let showCategoryManagerModal = $state(false);
let newCategoryName = $state('');
let editingCategoryId = $state(null);
let editCategoryName = $state('');

async function openCategoryManager() {
	newCategoryName = '';
	await refreshCategoriasFromServer();
	showCategoryManagerModal = true;
}

function closeCategoryManager() {
	showCategoryManagerModal = false;
	cancelEditCategory();
}

function cancelEditCategory() {
	editingCategoryId = null;
	editCategoryName = '';
}

function handleCategoryModalKeydown(/** @type {KeyboardEvent} */ event) {
	if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
		event.preventDefault();
		closeCategoryManager();
	}
}

async function refreshCategoriasFromServer() {
	try {
		const updatedCategorias = await fetch('/ep/portal_noticias/categorias').then((d) => d.json());
		categorias = Array.isArray(updatedCategorias)
			? updatedCategorias.filter((categoria) => categoria.status === 'Ativo')
			: [];
	} catch (error) {
		console.error('Erro ao atualizar categorias:', error);
	}
}

async function handleAddCategorySubmit(/** @type {SubmitEvent} */ event) {
	event.preventDefault();
	if (!newCategoryName.trim()) {
		return;
	}

	try {
		const response = await fetch('/ep/portal_noticias/categorias', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				nome: newCategoryName.trim(),
				descricao: '',
				status: 'Ativo'
			})
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData?.message ?? 'Não foi possível criar a categoria');
		}

		await refreshCategoriasFromServer();
		newCategoryName = '';
	} catch (error) {
		console.error('Erro ao criar categoria:', error);
		alert(error.message ?? 'Erro ao criar categoria');
	}
}

function startEditCategory(category) {
	editingCategoryId = category.id_categoria;
	editCategoryName = category.nome ?? '';
}

async function handleEditCategorySubmit(/** @type {SubmitEvent} */ event) {
	event.preventDefault();
	if (!editingCategoryId || !editCategoryName.trim()) {
		return;
	}

	const categoriaAtual = Array.isArray(categorias)
		? categorias.find((cat) => cat.id_categoria === editingCategoryId)
		: undefined;

	try {
		const response = await fetch(`/ep/portal_noticias/categorias/${editingCategoryId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				nome: editCategoryName.trim(),
				descricao: categoriaAtual?.descricao ?? '',
				status: categoriaAtual?.status ?? 'Ativo'
			})
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData?.message ?? 'Não foi possível atualizar a categoria');
		}

		await refreshCategoriasFromServer();
		cancelEditCategory();
	} catch (error) {
		console.error('Erro ao atualizar categoria:', error);
		alert(error.message ?? 'Erro ao atualizar categoria');
	}
}

async function handleDeleteCategory(idCategoria) {
	if (!idCategoria) return;

	if (!confirm('Tem a certeza que pretende eliminar esta categoria?')) {
		return;
	}

	try {
		const response = await fetch(`/ep/portal_noticias/categorias/${idCategoria}`, {
			method: 'DELETE'
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData?.message ?? 'Não foi possível eliminar a categoria');
		}

		await refreshCategoriasFromServer();
		if (editingCategoryId === idCategoria) {
			cancelEditCategory();
		}
	} catch (error) {
		console.error('Erro ao eliminar categoria:', error);
		alert(error.message ?? 'Erro ao eliminar categoria');
	}
}

	// tipo 0 ou null/undefined contam para tabela normal
	function isTipoNormal(noticia) {
		return noticia.tipo === 0 || noticia.tipo === null || noticia.tipo === undefined;
	}

	// tipo 1 é tabela de rádios
	function isTipoMedia(noticia) {
		return noticia.tipo === 1;
	}

function toggleFeature() {
	isToggled = !isToggled;

	const categoriaInputContainer = document.getElementById('categoriaInputContainer');
	if (isToggled) {
		document.getElementById('radioTable').hidden = false;
		document.getElementById('defaultTable').hidden = true;
		refreshRadioTable();
		if (categoriaInputContainer) categoriaInputContainer.style.display = 'none';
	} else {
		document.getElementById('radioTable').hidden = true;
		document.getElementById('defaultTable').hidden = false;
		refreshTable();
		if (table && table.columns) {
			table.columns.adjust().responsive.recalc();
		}
		if (categoriaInputContainer) categoriaInputContainer.style.display = 'block';
	}
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

	function handleSelect(noticia) {
		noticiaSelecionada = noticia;
		goto(`/portal_noticias/editar/${noticia.id_noticia}`);
	}

	function handleSelectdois(noticia) {
		noticiaSelecionada = noticia;
		goto(`/portal_noticias/editarmedia/${noticia.id_noticia}`);
	}

	async function updateNoticias() {
		originalNoticiasData = await fetch('/ep/portal_noticias/dados').then((d) => d.json());
		filteredNoticias = originalNoticiasData.filter(
			(n) => n.estado !== 'eliminada' && isTipoNormal(n)
		);
		noticiasData = filteredNoticias;
	}

	function showFullNews(noticia) {
		goto(`/portal_noticias/noticia/${noticia.id_noticia}`);
	}

	function onHandleSubmit(e) {
		e.preventDefault();
		pesquisarNoticia();
		return;
	}

	function formatDate(dateString) {
		const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
		return new Date(dateString).toLocaleDateString('pt-PT', options);
	}

	function pesquisarNoticia() {
		const keyword = diacriticless(formFilter.titulo.toLowerCase().trim());

		// tabela normal
		if (!isToggled) {
			let filteredByKeyword = noticiasData;
			if (keyword !== '') {
				filteredByKeyword = noticiasData.filter((noticia) => {
					const tituloWithoutAccents = diacriticless(noticia.titulo.toLowerCase());
					const textoWithoutAccents = diacriticless(noticia.texto.toLowerCase());
					return (
						tituloWithoutAccents.includes(keyword) ||
						textoWithoutAccents.includes(keyword)
					);
				});
			}

			filteredNoticias = filteredByKeyword.filter(
				(noticia) =>
					(formFilter.categoria === '' ||
						noticia.pn_categoria.id_categoria === formFilter.categoria) &&
					(formFilter.estado === '' || noticia.estado === formFilter.estado)
			);

			refreshTable();
		} else {
			// tabela rádio
			let filteredRadioByKeyword = notData;
			if (keyword !== '') {
				filteredRadioByKeyword = notData.filter((noticia) => {
					const tituloWithoutAccents = diacriticless(noticia.titulo.toLowerCase());
					return tituloWithoutAccents.includes(keyword);
				});
			}

			noticiasDatamedia = filteredRadioByKeyword.filter(
				(noticia) => formFilter.estado === '' || noticia.estado === formFilter.estado
			);

			refreshRadioTable();
		}
	}

	function createNoticia() {
		goto('portal_noticias/criar');
	}

	let table = $state();
	let el = $state();

	let table_columns = [
		{ title: $t('divNoticias.titulo'), width: '1%' },
		{
			title: $t('divNoticias.estado'),
			width: '1%',
			render: function (data, type, row, meta) {
				const estado = row[1];
				let estadoClass = '';
				if (estado === 'Pendente') {
					estadoClass = 'estado-pendente';
				} else if (estado === 'Publicado') {
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
		{ title: $t('divNoticias.dataCriacao'), width: '1%', orderable: false },
		{ title: $t('divNoticias.categoria'), width: '2%' },
		{
			title: 'Anexos',
			width: '1%',
			render: function (data, type, row, meta) {
				let badgeIcon = '';
				let badgeColor = 'badge-secondary';

				const anexos = row[4] ?? [];
				const count = Array.isArray(anexos) ? anexos.length : 0;

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
			title: 'Facebook',
			width: '1%',
			render: (data, type, row) =>
				row[5] !== null && row[5] !== ''
					? `<div class="d-flex justify-content-center">✔️</div>`
					: ''
		},
		{
			title: 'Instagram',
			width: '1%',
			render: (data, type, row) =>
				row[6] !== null && row[6] !== ''
					? `<div class="d-flex justify-content-center">✔️</div>`
					: ''
		},
		{
			title: 'LinkedIn',
			width: '1%',
			render: (data, type, row) =>
				row[7] !== null && row[7] !== ''
					? `<div class="d-flex justify-content-center">✔️</div>`
					: ''
		},
		{
			title: 'Twitter',
			width: '1%',
			render: (data, type, row) =>
				row[8] !== null && row[8] !== ''
					? `<div class="d-flex justify-content-center">✔️</div>`
					: ''
		},
		{
			title: 'Tiktok',
			width: '1%',
			render: (data, type, row) =>
				row[9] !== null && row[9] !== ''
					? `<div class="d-flex justify-content-center">✔️</div>`
					: ''
		},
		{
			title: '',
			orderable: false,
			width: '1%',
			render: (data, type, row, meta) => {
				if (row[1] === 'Pendente') {
					return `
					<div class="d-flex justify-content-center">
						<button
							data-rowid="${row[4]}"
							data-rowindex="${meta.row}"
							class="btn btn-sm btn-outline-primary table_button_edit_projeto_class"
						>
							<i class="fa fa-edit"></i>
						</button>
					</div>`;
				}
				return `
				<div class="d-flex justify-content-center">
					<button
						class="btn btn-sm btn-outline-primary table_button_edit_projeto_class disabled"
						style="cursor: not-allowed; color: #6c757d; border-color: #6c757d; opacity: 0.20;"
					>
						<i class="fa fa-edit"></i>
					</button>
				</div>`;
			}
		},
		{
			title: '',
			orderable: false,
			width: '1%',
			render: (data, type, row, meta) => {
				if (row[1] === 'Pendente') {
					return `
					<div class="d-flex justify-content-center">
						<button
							data-rowid="${row[4]}"
							data-rowindex="${meta.row}"
							class="btn btn-sm btn-outline-danger table_button_delete_projeto_class"
						>
							<i class="fa fa-trash"></i>
						</button>
					</div>`;
				}
				return `
				<div class="d-flex justify-content-center">
					<button
						class="btn btn-sm btn-outline-primary table_button_edit_projeto_class disabled"
						style="cursor: not-allowed; color: #6c757d; border-color: #6c757d; opacity: 0.20;"
					>
						<i class="fa fa-trash"></i>
					</button>
				</div>`;
			}
		}
	];

	let radioTableColumns = [
		{ title: $t('divNoticias.Assunto'), width: '20%' },
		{
			title: $t('divNoticias.estado'),
			width: '1%',
			render: function (data, type, row, meta) {
				let estado = row[1];
				let estadoClass = '';

				if (estado === 'Pendente') {
					estadoClass = 'estado-pendente';
					estado = 'Rascunho';
				} else if (estado === 'Publicado') {
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
			render: function (data, type, row, meta) {
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
			title: 'Nome do Rádio',
			width: '20%',
			render: function (data, type, row, meta) {
				return row[4] || 'Sem rádios/jornais';
			}
		},
		{
			title: 'Nº radios/jornais',
			width: '10%',
			render: function (data, type, row, meta) {
				return row[5] ?? 0;
			}
		},
		{
			title: '',
			orderable: false,
			width: '1%',
			render: (data, type, row, meta) => `
				<div class="d-flex justify-content-center">
					<button
						data-rowid="${row[0]}"
						data-rowindex="${meta.row}"
						class="btn btn-sm btn-outline-primary table_button_edit_projeto2_class"
					>
						<i class="fa fa-edit"></i>
					</button>
				</div>`
		},
		{
			title: '',
			orderable: false,
			width: '1%',
			render: (data, type, row, meta) => `
				<div class="d-flex justify-content-center">
					<button
						data-rowid="${row[0]}"
						data-rowindex="${meta.row}"
						class="btn btn-sm btn-outline-danger table_button_delete_projeto2_class"
					>
						<i class="fa fa-trash"></i>
					</button>
				</div>`
		}
	];

	onMount(async () => {
		globalThis.$.fn.dataTable.ext.errMode = 'none';

		const [categorias_fetch, noticias_fetch, radio_jornal_fetch] = await Promise.all([
			fetch('/ep/portal_noticias/categorias').then((d) => d.json()),
			fetch('/ep/portal_noticias/dados').then((d) => d.json()),
			fetch('/ep/portal_noticias/radio_jornal').then((d) => d.json())
		]);

		originalNoticiasData = noticias_fetch;

		// agora tipo null também entra na tabela normal
		filteredNoticias = originalNoticiasData.filter(
			(n) => n.estado !== 'eliminada' && isTipoNormal(n)
		);
		noticiasData = filteredNoticias;

		// tabela rádio só tipo 1
		noticiasDatamedia = originalNoticiasData.filter(
			(n) => n.estado !== 'eliminada' && isTipoMedia(n)
		);
		notData = noticiasDatamedia;

		jornais_radios = radio_jornal_fetch;
		categorias = Array.isArray(categorias_fetch)
			? categorias_fetch.filter((categoria) => categoria.status === 'Ativo')
			: [];

		table = jQuery(el).DataTable({
			dom: 'Bfrtip',
			columns: table_columns,
			responsive: true,
			buttons: ['pageLength', 'pdf', 'csv', 'excel', 'copy', 'colvis'],
			pageLength: 25,
			order: [[1, 'desc']],
			drawCallback: function () {
				jQuery('.datatable-on').parent().removeClass('container-fluid');
				jQuery('#modulepage_content').fadeIn(600);
				setTimeout(function () {
					table.columns.adjust().responsive.recalc();
				}, 100);
			},
			language: locale.get() == 'pt' ? dt_pt : dt_en
		});

		radioTable = jQuery(radioTableEl).DataTable({
			dom: 'Bfrtip',
			columns: radioTableColumns,
			responsive: true,
			buttons: ['pageLength', 'pdf', 'csv', 'excel', 'copy', 'colvis'],
			pageLength: 25,
			order: [[1, 'desc']],
			language: locale.get() == 'pt' ? dt_pt : dt_en
		});

		jQuery('#search-input').on('keyup', function () {
			table.search(this.value).draw();
		});

		// começa na tabela de rádios
		setTimeout(() => {
			toggleFeature();
		}, 100);
	});

	async function onDeleteRow() {
		const noticias_reponse = await getData();

		filteredNoticias = noticias_reponse.filter(
			(noticia) => noticia.estado !== 'eliminada' && isTipoNormal(noticia)
		);

		noticiasData = filteredNoticias;

		refreshTable();
	}

	function refreshTable() {
		if (!table) return;

		table.clear();

		filteredNoticias.forEach((noticia, index) => {
			const rowData = [
				`<div class="clickable-cell" data-rowindex="${index}">${noticia.titulo}</div>`,
				noticia.estado,
				formatDate(noticia.data_criacao),
				noticia.pn_categoria.nome,
				noticia.pn_anexos ?? [],
				noticia.texto_facebook,
				noticia.texto_instagram,
				noticia.texto_linkedin,
				noticia.texto_twitter,
				noticia.texto_tiktok
			];

			const rowNode = table.row.add(rowData).node();
			rowNode.dataset.rowindex = String(index);
			rowNode.classList.add('clickable-row');
		});

		jQuery(el)
			.off('click', 'tbody tr.clickable-row')
			.on('click', 'tbody tr.clickable-row', function (event) {
				const target = event.target;
				const isActionButton = jQuery(target).closest(
					'.table_button_details_projeto_class, .table_button_edit_projeto_class, .table_button_delete_projeto_class, button, a'
				).length;
				if (isActionButton) {
					return;
				}

				const rowIndex = this.dataset.rowindex;
				if (rowIndex === undefined) return;
				const noticia = filteredNoticias[Number(rowIndex)];
				if (noticia) {
					showFullNews(noticia);
				}
			});

		jQuery(document)
			.off('click', '.table_button_details_projeto_class')
			.on('click', '.table_button_details_projeto_class', function () {
				const rowIndex = jQuery(this).data('rowindex');
				const noticia = filteredNoticias[rowIndex];
				showFullNews(noticia);
			});

		jQuery(document)
			.off('click', '.table_button_edit_projeto_class')
			.on('click', '.table_button_edit_projeto_class', function () {
				const rowIndex = jQuery(this).data('rowindex');
				const noticia = filteredNoticias[rowIndex];
				handleSelect(noticia);
			});

		jQuery(document)
			.off('click', '.table_button_delete_projeto_class')
			.on('click', '.table_button_delete_projeto_class', function () {
				const rowIndex = jQuery(this).data('rowindex');
				const noticia = filteredNoticias[rowIndex];
				const modal = get(modalStore);
				if (modal && modal.onOpenModal) {
					modal.onOpenModal(noticia);
				}
			});

		table.draw();
		loadingData = false;
	}

	async function getData() {
		const [, originalNoticias] = await Promise.all([
			fetch('/ep/portal_noticias/categorias').then((d) => d.json()),
			fetch('/ep/portal_noticias/dados').then((d) => d.json())
		]);

		originalNoticiasData = originalNoticias;
		return originalNoticias;
	}

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

			const rowNode = radioTable.row.add(rowData).node();
			rowNode.dataset.rowindex = String(index);
			rowNode.classList.add('clickable-row');
		});

		jQuery(radioTableEl)
			.off('click', 'tbody tr.clickable-row')
			.on('click', 'tbody tr.clickable-row', function (event) {
				const target = event.target;
				const isActionButton = jQuery(target).closest(
					'.table_button_details_projeto2_class, .table_button_edit_projeto2_class, .table_button_delete_projeto2_class, button, a'
				).length;
				if (isActionButton) {
					return;
				}

				const rowIndex = this.dataset.rowindex;
				if (rowIndex === undefined) return;
				const noticia = noticiasDatamedia[Number(rowIndex)];
				if (noticia) {
					showFullNews(noticia);
				}
			});

		jQuery(document)
			.off('click', '.table_button_details_projeto2_class')
			.on('click', '.table_button_details_projeto2_class', function () {
				const rowIndex = jQuery(this).data('rowindex');
				const noticia = noticiasDatamedia[rowIndex];
				showFullNews(noticia);
			});

		jQuery(document)
			.off('click', '.table_button_edit_projeto2_class')
			.on('click', '.table_button_edit_projeto2_class', function () {
				const rowIndex = jQuery(this).data('rowindex');
				const noticia = noticiasDatamedia[rowIndex];
				handleSelectdois(noticia);
			});

		jQuery(document)
			.off('click', '.table_button_delete_projeto2_class')
			.on('click', '.table_button_delete_projeto2_class', function () {
				const rowIndex = jQuery(this).data('rowindex');
				const noticia = noticiasDatamedia[rowIndex];
				const modal = get(modalStore);
				if (modal && modal.onOpenModal) {
					modal.onOpenModal(noticia);
				}
			});

		radioTable.draw();
	}

	run(() => {
		if (table) {
			refreshTable();
		}
	});

	let items_breadcrum = $derived([
		{
			icon_class: 'fas fa-plus',
			url: '#',
			designacao: $t('divPublicar.cria'),
			function: createNoticia
		}
	]);
</script>

<Breadcrum
	modulo={breadcrumModuleName}
	objeto={breadcrumPageName}
	menu_items={items_breadcrum}
/>

<div class="tableNews">
	<div class="row filter">
		<form onsubmit={onHandleSubmit} class="w-100">
			<div class="row filter-row align-items-start g-3">
				<!-- CATEGORIA -->
				<div class="col-md-2 col-lg-2" id="categoriaInputContainer">
					<label for="categoriaInput" class="filter-label">
						{$t('divPublicar.Categorias')}
					</label>
					<select
						id="categoriaInput"
						bind:value={formFilter.categoria}
						class="form-control"
					>
						<option value="">{$t('divNoticias.todas')}</option>
						{#each categorias.filter((categoria) => categoria.status === 'Ativo') as categoria}
							<option value={categoria.id_categoria}>{categoria.nome}</option>
						{/each}
					</select>
				</div>
	
				<!-- ESTADO -->
				<div class="col-md-2 col-lg-2">
					<label for="estadoInput" class="filter-label">
						{$t('divNoticias.estado')}
					</label>
					<select
						id="estadoInput"
						bind:value={formFilter.estado}
						class="form-control"
					>
						<option value="">{ $t('divNoticias.todos') }</option>
						<option value={$t('divNoticias.pendente')}>
							{ $t('divNoticias.pendente') }
						</option>
						<option value={$t('divNoticias.publicado')}>{ $t('divNoticias.publicado') }</option>
						{#if !isToggled}
							<option value={$t('divNoticias.agendado')}>{ $t('divNoticias.agendado') }</option>
						{/if}
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
	
	
	<div>
		<!-- Tabela normal -->
		<div id="defaultTable" hidden={isToggled}>
			<div id="conteudo_carregado">
				<div hidden={loadingData} class="row" id="modulepage_content" style="display: block">
					<div class="table-responsive">
						<table
							bind:this={el}
							class="datatable-on table-striped hover datatable table-sm nowrap no-footer dtr-inline"
						></table>
					</div>
				</div>
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

			<div class="add-category-footer">
				<button type="button" class="btn btn-primary btn-sm add-category-footer-btn" onclick={openCategoryManager}>
					<i class="fas fa-cog me-2"></i>
					Gerir categorias
				</button>
			</div>
		</div>

		<!-- Tabela rádios -->
		<div id="radioTable" hidden={!isToggled}>
			<div class="table-responsive">
				<table
					bind:this={radioTableEl}
					class="datatable-on table-striped hover datatable table-sm nowrap no-footer dtr-inline"
				></table>
			</div>
		</div>
	</div>
</div>

{#if showCategoryManagerModal}
	<div class="add-category-layer">
		<div
			class="add-category-backdrop"
			role="button"
			tabindex="0"
			aria-label="Fechar gestor de categorias"
			onclick={closeCategoryManager}
			onkeydown={handleCategoryModalKeydown}
		></div>
		<div class="add-category-modal" role="dialog" aria-modal="true">
			<h5>Gerir categorias</h5>

			<section class="category-section">
				<h6>Adicionar nova</h6>
				<form onsubmit={handleAddCategorySubmit} class="category-form">
					<input
						id="newCategoryName"
						type="text"
						class="form-control"
						placeholder="Inserir nome"
						bind:value={newCategoryName}
					/>
					<button type="submit" class="btn btn-primary btn-sm">Adicionar</button>
				</form>
			</section>

			<section class="category-section">
				<h6>Existentes</h6>

				{#if !Array.isArray(categorias) || categorias.length === 0}
					<p class="text-muted small mb-0">Ainda não existem categorias</p>
				{:else}
					<div class="category-list">
						{#each categorias as categoria}
							<div class="category-list-item">
								{#if editingCategoryId === categoria.id_categoria}
									<form class="category-form inline" onsubmit={handleEditCategorySubmit}>
										<input
											type="text"
											class="form-control"
											bind:value={editCategoryName}
											placeholder="Nome da categoria"
										/>
										<button type="submit" class="btn btn-primary btn-sm">Guardar</button>
										<button type="button" class="btn btn-outline-secondary btn-sm" onclick={cancelEditCategory}>
											Cancelar
										</button>
									</form>
								{:else}
									<div class="category-name">{categoria.nome}</div>
									<div class="category-actions">
										<button type="button" class="btn btn-link p-0" onclick={() => startEditCategory(categoria)}>
											Editar
										</button>
										<button
											type="button"
											class="btn btn-link text-danger p-0"
											onclick={() => handleDeleteCategory(categoria.id_categoria)}
										>
											Apagar
										</button>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</section>

			<div class="modal-actions end">
				<button type="button" class="btn btn-outline-secondary btn-sm" onclick={closeCategoryManager}>
					Fechar
				</button>
			</div>
		</div>
	</div>
{/if}

<RemoveModal bind:this={removeModalBind} on:refreshData={onDeleteRow} />

<style>
	@import './portal_noticias.css';
	/* barra dos filtros tipo IPVC */
.row.filter {
	border-bottom: 1px solid #dde3ea;
	padding: 8px 24px 10px;
}

/* labels em cima, pequenas e azuis */
.filter-label {
	display: block;
	margin-bottom: 3px;
	font-size: 11px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.06em;
	color: #7fa0b5;
}

/* selects baixinhos e alinhados */
.filter-row .form-control {
	height: 34px;
	font-size: 13px;
	border-radius: 2px;
	border: 1px solid #cfd6dd;
	box-shadow: none;
}

#categoriaInputContainer {
	padding-left: 0;
	margin-left: -20px;
}

/* botão azul à direita, com largura fixa tipo print */
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

.add-category-footer {
	display: flex;
	justify-content: flex-start;
}

.add-category-footer-btn {
	min-width: 190px;
	background-color: #00a4e6;
	border-color: #00a4e6;
	color: #fff;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
}

.add-category-footer-btn i {
	font-size: 13px;
}

.add-category-layer {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1050;
}

.add-category-backdrop {
	position: absolute;
	inset: 0;
	background-color: rgba(0, 0, 0, 0.35);
	border: none;
	padding: 0;
	margin: 0;
	cursor: pointer;
}

.add-category-backdrop:focus {
	outline: none;
}

.add-category-modal {
	position: relative;
	z-index: 1060;
	background: #fff;
	border-radius: 6px;
	padding: 24px;
	width: min(420px, 90vw);
	box-shadow: 0 10px 35px rgba(37, 43, 70, 0.2);
}

.add-category-modal h5 {
	font-size: 16px;
	font-weight: 600;
	margin-bottom: 16px;
	text-transform: uppercase;
	color: #344153;
}

.add-category-modal h6 {
	font-size: 13px;
	font-weight: 600;
	color: #5b6d7c;
	text-transform: uppercase;
	margin-bottom: 10px;
}

.category-section + .category-section {
	margin-top: 18px;
}

.category-form {
	display: flex;
	gap: 10px;
	flex-wrap: wrap;
}

.category-form.inline {
	width: 100%;
}

.category-form.inline input {
	flex: 1;
}

.category-list {
	display: flex;
	flex-direction: column;
	gap: 10px;
	max-height: 260px;
	overflow-y: auto;
	padding-right: 4px;
}

.category-list-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	border: 1px solid #e5eaef;
	border-radius: 4px;
	padding: 8px 12px;
	gap: 12px;
}

.category-name {
	font-size: 14px;
	font-weight: 500;
	color: #344153;
}

.category-actions {
	display: flex;
	gap: 12px;
}

.category-actions .btn-link {
	font-size: 13px;
	text-decoration: none;
}

.category-actions .btn-link:hover {
	text-decoration: underline;
}

.add-category-modal .modal-actions {
	margin-top: 18px;
	display: flex;
	justify-content: flex-end;
	gap: 10px;
}

.add-category-modal .modal-actions.end {
	margin-top: 24px;
}

:global(.clickable-row) {
	cursor: pointer;
}



</style>
