<script>
	/**
	 * @typedef {{ id_categoria: string; nome: string; status?: string }} Categoria
	 */
	import Breadcrum from '$lib/components/Breadcrum.svelte';
	import { locale, t } from '$lib/translations/translations';
	import { onMount, tick } from 'svelte';
	import { get } from 'svelte/store';
	import { preventDefault } from 'svelte/legacy';
	import * as dt_pt from '$lib/translations/pt/datatables.json';
	import * as dt_en from '$lib/translations/en/datatables.json';
	import { configurePortalSidebar } from '../sidebar.config.js';
	import { sidebarOptions } from '$lib/runes/sidebarOptions.rune.svelte';

	/** @type {(key: string) => string} */
	const translate = (key) => get(t)(key);
	const TRANSLATION_FALLBACK = 'Loading translation...';

	/**
	 * @param {string} key
	 * @param {string} fallbackPt
	 * @param {string} [fallbackEn]
	 */
	function tf(key, fallbackPt, fallbackEn = fallbackPt) {
		const value = translate(key);
		if (!value || value === TRANSLATION_FALLBACK) {
			const currentLocale = get(locale);
			return currentLocale === 'en' ? fallbackEn : fallbackPt;
		}
		return value;
	}
	configurePortalSidebar('categorias', translate);

	const globalWithJQuery = /** @type {any} */ (globalThis);
	const jq = globalWithJQuery?.jQuery ?? globalWithJQuery?.$;

	let loadingData = $state(true);
	/** @type {Categoria[]} */
	let categorias = [];
	/** @type {Categoria[]} */
	let filteredCategorias = [];

	let formFilter = $state({
		nome: '',
		estado: ''
	});

let categoriaForm = $state(
	/** @type {{ id: string | null; nome: string; status: string }} */ ({
		id: null,
		nome: '',
		status: 'Ativo'
	})
);

	let isEditing = $state(false);
	let isSaving = $state(false);
	let statusMessage = $state('');
	let statusType = /** @type {'success' | 'error'} */ ($state('success'));
let deleteModal = $state(
	/** @type {{ open: boolean; categoria: Categoria | null }} */ ({
		open: false,
		categoria: null
	})
);

	let table = $state();
	let el = $state();
	/** @type {HTMLInputElement | null} */
	let nomeInput = null;
	/** @type {HTMLElement | null} */
	let formSectionEl = null;

	let tableColumns = [
		{ title: $t('divCategorias.nome'), width: '40%' },
		{ title: $t('divCategorias.estado'), width: '20%' },
		{ title: '', orderable: false, width: '13%' },
		{ title: '', orderable: false, width: '13%' },
		{ title: '', orderable: false, width: '14%' }
	];

	onMount(async () => {
		if (jq?.fn?.dataTable?.ext) {
			jq.fn.dataTable.ext.errMode = 'none';
		}

		await loadCategorias();

		table = jq(el).DataTable({
			dom: 'Bfrtip',
			columns: tableColumns,
			responsive: true,
			buttons: ['pageLength', 'pdf', 'csv', 'excel', 'copy', 'colvis'],
			pageLength: 25,
			order: [[0, 'asc']],
			language: locale.get() == 'pt' ? dt_pt : dt_en,
			drawCallback: function () {
				jq('.datatable-on').parent().removeClass('container-fluid');
				jq('#modulepage_content').fadeIn(600);
				setTimeout(function () {
					table.columns.adjust().responsive.recalc();
				}, 100);
			}
		});

		refreshTable();
	});

	async function loadCategorias() {
		try {
			loadingData = true;
			const response = await fetch('/ep/portal_noticias/categorias');
			const data = await response.json();
			categorias = Array.isArray(data) ? data : [];
		} catch (error) {
			console.error('Erro ao carregar categorias', error);
			categorias = [];
			showStatus('error', $t('divCategorias.errorGeneric'));
		} finally {
			applyFilters();
			loadingData = false;
		}
	}

	function applyFilters() {
		const nomeFilter = formFilter.nome.toLowerCase().trim();

		filteredCategorias = categorias
			.filter((categoria) => {
				const safeNome = (categoria.nome ?? '').toLowerCase();
				const matchesNome = nomeFilter === '' || safeNome.includes(nomeFilter);
				const matchesEstado =
					formFilter.estado === '' ||
					((categoria.status ?? '').toLowerCase() === formFilter.estado.toLowerCase());

				return matchesNome && matchesEstado;
			})
			.sort((a, b) =>
				(a.nome ?? '').localeCompare(b.nome ?? '', 'pt', { sensitivity: 'base' })
			);

		refreshTable();
	}

	function refreshTable() {
		if (!table) return;

		table.clear();

		filteredCategorias.forEach((categoria, index) => {
			const estado = categoria.status || 'Ativo';
			const isActive = estado === 'Ativo';
			const toggleBtnClass = isActive ? 'btn btn-sm btn-outline-success' : 'btn btn-sm btn-outline-warning';
			const toggleIcon = isActive ? 'fa fa-toggle-on' : 'fa fa-toggle-off';
			const toggleTitle = isActive
				? tf('divCategorias.desativar', 'Desativar categoria', 'Deactivate category')
				: tf('divCategorias.ativar', 'Ativar categoria', 'Activate category');

			table
				.row.add([
					`<div class="clickable-cell" data-rowindex="${index}">${categoria.nome}</div>`,
					`<span class="estado ${
						estado === 'Ativo' ? 'estado-publicado' : 'estado-pendente'
					}">${estado}</span>`,
					`<div class="d-flex justify-content-center">
						<button
							data-rowindex="${index}"
							class="btn btn-sm btn-outline-primary table_button_edit_categoria"
						>
							<i class="fa fa-edit"></i>
						</button>
					</div>`,
					`<div class="d-flex justify-content-center">
						<button
							data-rowindex="${index}"
							class="${toggleBtnClass} table_button_toggle_categoria"
							title="${toggleTitle}"
						>
							<i class="${toggleIcon}"></i>
						</button>
					</div>`,
					`<div class="d-flex justify-content-center">
						<button
							data-rowindex="${index}"
							class="btn btn-sm btn-outline-danger table_button_delete_categoria"
						>
							<i class="fa fa-trash"></i>
						</button>
					</div>`
				])
				.node();
		});

		jq(el)
			.off('click', '.clickable-cell')
			.on('click', '.clickable-cell', (/** @type {Event} */ event) => {
				const target = /** @type {HTMLElement} */ (event.currentTarget);
				const rowIndex = jq(target).data('rowindex');
				const categoria = filteredCategorias[rowIndex];
				beginEdit(categoria);
			});

		jq(document)
			.off('click', '.table_button_edit_categoria')
			.on('click', '.table_button_edit_categoria', (/** @type {Event} */ event) => {
				const target = /** @type {HTMLElement} */ (event.currentTarget);
				const rowIndex = jq(target).data('rowindex');
				const categoria = filteredCategorias[rowIndex];
				beginEdit(categoria);
			});

		jq(document)
			.off('click', '.table_button_toggle_categoria')
			.on('click', '.table_button_toggle_categoria', (/** @type {Event} */ event) => {
				const target = /** @type {HTMLElement} */ (event.currentTarget);
				const rowIndex = jq(target).data('rowindex');
				const categoria = filteredCategorias[rowIndex];
				toggleCategoriaStatus(categoria);
			});

		jq(document)
			.off('click', '.table_button_delete_categoria')
			.on('click', '.table_button_delete_categoria', (/** @type {Event} */ event) => {
				const target = /** @type {HTMLElement} */ (event.currentTarget);
				const rowIndex = jq(target).data('rowindex');
				const categoria = filteredCategorias[rowIndex];
				openDeleteModal(categoria);
			});

		table.draw();
	}

	function onFilterSubmit() {
		applyFilters();
	}

	/**
	 * @param {Categoria | undefined} categoria
	 */
	function beginEdit(categoria) {
		if (!categoria) return;
		categoriaForm = {
			id: categoria.id_categoria,
			nome: categoria.nome ?? '',
			status: categoria.status ?? 'Ativo'
		};
		isEditing = true;
		showStatus(null, null);
		scrollToForm();
	}

	function resetForm() {
		categoriaForm = { id: null, nome: '', status: 'Ativo' };
		isEditing = false;
		showStatus(null, null);
		focusInput();
	}

	function startNewCategoria() {
		resetForm();
		scrollToForm();
	}

	/**
	 * @param {Categoria} categoria
	 */
	function openDeleteModal(categoria) {
		deleteModal = {
			open: true,
			categoria
		};
	}

	function closeDeleteModal() {
		deleteModal = {
			open: false,
			categoria: null
		};
	}

	async function focusInput() {
		await tick();
		nomeInput?.focus();
	}

	function scrollToForm() {
		focusInput();
		formSectionEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	/**
	 * @param {'success' | 'error' | null} type
	 * @param {string | null} message
	 */
	function showStatus(type, message) {
		statusType = /** @type {'success' | 'error'} */ (type ?? 'success');
		statusMessage = message ?? '';
		if (message) {
			setTimeout(() => {
				statusMessage = '';
			}, 3500);
		}
	}

	async function saveCategoria() {
		if (!categoriaForm.nome.trim()) {
			showStatus('error', $t('divCategorias.errorGeneric'));
			return;
		}

		isSaving = true;
		const payload = {
			nome: categoriaForm.nome.trim(),
			status: categoriaForm.status ?? 'Ativo'
		};
		const endpoint = categoriaForm.id
			? `/ep/portal_noticias/categorias/${categoriaForm.id}`
			: '/ep/portal_noticias/categorias';
		const method = categoriaForm.id ? 'PUT' : 'POST';

		try {
			const response = await fetch(endpoint, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				throw new Error('Erro a guardar categoria');
			}

			showStatus(
				'success',
				categoriaForm.id ? $t('divCategorias.successUpdate') : $t('divCategorias.successCreate')
			);
			resetForm();
			await loadCategorias();
		} catch (error) {
			console.error(error);
			showStatus('error', $t('divCategorias.errorGeneric'));
		} finally {
			isSaving = false;
		}
	}

	/**
	 * @param {Categoria | undefined} categoria
	 */
	async function deleteCategoria(categoria) {
		if (!categoria) return;

		try {
			const response = await fetch(`/ep/portal_noticias/categorias/${categoria.id_categoria}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error('Erro a eliminar categoria');
			}

			showStatus(
				'success',
				tf(
					'divCategorias.successDelete',
					'Categoria eliminada com sucesso.',
					'Category deleted successfully.'
				)
			);
			if (isEditing && categoriaForm.id === categoria.id_categoria) {
				resetForm();
			}
		closeDeleteModal();
			await loadCategorias();
		} catch (error) {
			console.error(error);
			showStatus('error', $t('divCategorias.errorGeneric'));
		}
	}

	/**
	 * @param {Categoria | undefined} categoria
	 */
	async function toggleCategoriaStatus(categoria) {
		if (!categoria) return;
		const isActive = (categoria.status ?? 'Ativo') === 'Ativo';
		const nextStatus = isActive ? 'Desativo' : 'Ativo';

		try {
			const response = await fetch(`/ep/portal_noticias/categorias/${categoria.id_categoria}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ nome: categoria.nome ?? '', status: nextStatus })
			});

			if (!response.ok) {
				throw new Error('Erro ao atualizar categoria');
			}

			const successMessage =
				nextStatus === 'Ativo'
					? tf(
							'divCategorias.successActivate',
							'Categoria ativada com sucesso.',
							'Category activated successfully.'
					  )
					: tf(
							'divCategorias.successDeactivate',
							'Categoria desativada com sucesso.',
							'Category deactivated successfully.'
					  );
			showStatus('success', successMessage);
			if (isEditing && categoriaForm.id === categoria.id_categoria) {
				categoriaForm = {
					...categoriaForm,
					status: nextStatus
				};
			}
			await loadCategorias();
		} catch (error) {
			console.error(error);
			showStatus('error', $t('divCategorias.errorGeneric'));
		}
	}

	let items_breadcrum = $derived([
		{
			icon_class: 'fas fa-plus',
			url: '#',
			designacao: $t('divCategorias.nova'),
			function: startNewCategoria
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
		<form class="w-100" onsubmit={preventDefault(onFilterSubmit)}>
			<div class="row filter-row align-items-start g-3">
				<div class="col-md-4 col-lg-4">
					<label for="nomeInputFilter" class="filter-label">
						{$t('divCategorias.nome')}
					</label>
					<input
						id="nomeInputFilter"
						type="text"
						class="form-control"
						placeholder={$t('divCategorias.nomePlaceholder')}
						bind:value={formFilter.nome}
					/>
				</div>

				<div class="col-md-3 col-lg-3">
					<label for="estadoInputFilter" class="filter-label">
						{$t('divCategorias.estado')}
					</label>
					<select
						id="estadoInputFilter"
						class="form-control"
						bind:value={formFilter.estado}
					>
						<option value="">{ $t('divCategorias.todos') }</option>
						<option value="Ativo">{ $t('divCategorias.ativo') }</option>
						<option value="Desativo">{ $t('divCategorias.desativo') }</option>
					</select>
				</div>

				<div class="col-md-3 col-lg-3 d-flex flex-column align-items-center align-items-md-start">
					<span class="filter-label d-block">&nbsp;</span>
					<button
						type="submit"
						class="btn btn-primary btn-sm filter-submit"
						style="margin-top: 0px; background-color: #00a4e6; border-color: #00a4e6;"
						aria-label={$t('divCategorias.pesquisar')}
					>
						<i class="fas fa-search"></i>
					</button>
				</div>
			</div>
		</form>
	</div>

	<section class="categoria-form card" bind:this={formSectionEl}>
		<div class="card-body">
			<h5 class="card-title">
				{isEditing ? $t('divCategorias.editarTitulo') : $t('divCategorias.criarTitulo')}
			</h5>
			{#if statusMessage}
				<div
					class={`alert ${statusType === 'success' ? 'alert-success' : 'alert-danger'} mb-3`}
					role="alert"
				>
					{statusMessage}
				</div>
			{/if}
			<form onsubmit={preventDefault(saveCategoria)}>
				<div class="row">
					<div class="col-md-6 col-lg-5">
						<label for="categoriaNome" class="filter-label">
							{$t('divCategorias.nome')}
						</label>
						<input
							id="categoriaNome"
							class="form-control"
							type="text"
							bind:value={categoriaForm.nome}
							placeholder={$t('divCategorias.nomePlaceholder')}
							bind:this={nomeInput}
							maxlength="120"
							required
						/>
					</div>
				</div>
				<div class="form-buttons mt-3">
					<button type="submit" class="btn btn-primary btn-sm" disabled={isSaving}>
						{isEditing ? $t('divCategorias.atualizar') : $t('divCategorias.guardar')}
					</button>
					{#if isEditing}
						<button
							type="button"
							class="btn btn-outline-secondary btn-sm"
							onclick={resetForm}
							disabled={isSaving}
						>
							{$t('divCategorias.cancelar')}
						</button>
					{/if}
				</div>
			</form>
		</div>
	</section>

	<div id="defaultTable">
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
	</div>
</div>

{#if deleteModal.open}
	<div class="modal-backdrop-custom">
		<div class="modal-card">
			<h5>{tf('divCategorias.confirmDeleteTitle', 'Eliminar categoria', 'Delete category')}</h5>
			<p class="modal-text">
				{tf(
					'divCategorias.confirmDelete',
					'Tem a certeza que pretende eliminar esta categoria? Esta ação não pode ser desfeita.',
					'Are you sure you want to delete this category? This action cannot be undone.'
				)}
			</p>
			<div class="modal-actions">
				<button
					class="btn btn-sm btn-danger"
					onclick={() => deleteModal.categoria && deleteCategoria(deleteModal.categoria)}
				>
					{tf('divCategorias.confirmDeleteConfirm', 'Eliminar', 'Delete')}
				</button>
				<button class="btn btn-sm btn-outline-secondary" onclick={closeDeleteModal}>
					{tf('divCategorias.confirmDeleteCancel', 'Cancelar', 'Cancel')}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	@import '../portal_noticias.css';

	.categoria-form {
		margin: 16px 24px;
		border: 1px solid #dde3ea;
		border-radius: 6px;
	}

	.categoria-form .card-body {
		padding: 20px 24px;
	}

	.categoria-form .card-title {
		font-size: 16px;
		font-weight: 600;
		color: #29363d;
	}

	.form-buttons .btn + .btn {
		margin-left: 8px;
	}

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

