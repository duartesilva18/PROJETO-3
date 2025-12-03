<script>
	/**
	 * @typedef {{ id_tag: string; nome: string; status?: string }} Tag
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
	configurePortalSidebar('tags', translate);

	const globalWithJQuery = /** @type {any} */ (globalThis);
	const jq = globalWithJQuery?.jQuery ?? globalWithJQuery?.$;

	let loadingData = $state(true);
	/** @type {Tag[]} */
	let tags = [];
	/** @type {Tag[]} */
	let filteredTags = [];

	let formFilter = $state({
		nome: '',
		estado: ''
	});

	let tagForm = $state(
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
		/** @type {{ open: boolean; tag: Tag | null }} */ ({
			open: false,
			tag: null
		})
	);

	let table = $state();
	let el = $state();
	/** @type {HTMLInputElement | null} */
	let nomeInput = null;
	/** @type {HTMLElement | null} */
	let formSectionEl = null;

	let tableColumns = [
		{ title: tf('divTags.nome', 'Nome', 'Name'), width: '40%' },
		{ title: tf('divTags.estado', 'Estado', 'Status'), width: '20%' },
		{ title: '', orderable: false, width: '13%' },
		{ title: '', orderable: false, width: '13%' },
		{ title: '', orderable: false, width: '14%' }
	];

	onMount(async () => {
		if (jq?.fn?.dataTable?.ext) {
			jq.fn.dataTable.ext.errMode = 'none';
		}

		await loadTags();

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

	async function loadTags() {
		try {
			loadingData = true;
			const response = await fetch('/ep/portal_noticias/tags');
			const data = await response.json();
			tags = Array.isArray(data) ? data : [];
		} catch (error) {
			console.error('Erro ao carregar tags', error);
			tags = [];
			showStatus('error', tf('divTags.errorGeneric', 'Não foi possível concluir a operação.', 'Unable to complete the operation.'));
		} finally {
			applyFilters();
			loadingData = false;
		}
	}

	function applyFilters() {
		const nomeFilter = formFilter.nome.toLowerCase().trim();

		filteredTags = tags
			.filter((tag) => {
				const safeNome = (tag.nome ?? '').toLowerCase();
				const matchesNome = nomeFilter === '' || safeNome.includes(nomeFilter);
				const matchesEstado =
					formFilter.estado === '' ||
					((tag.status ?? '').toLowerCase() === formFilter.estado.toLowerCase());

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

		filteredTags.forEach((tag, index) => {
			const estado = tag.status || 'Ativo';
			const isActive = estado === 'Ativo';
			const toggleBtnClass = isActive ? 'btn btn-sm btn-outline-success' : 'btn btn-sm btn-outline-warning';
			const toggleIcon = isActive ? 'fa fa-toggle-on' : 'fa fa-toggle-off';
			const toggleTitle = isActive
				? tf('divTags.desativar', 'Desativar tag', 'Deactivate tag')
				: tf('divTags.ativar', 'Ativar tag', 'Activate tag');

			table
				.row.add([
					`<div class="clickable-cell" data-rowindex="${index}">${tag.nome}</div>`,
					`<span class="estado ${
						estado === 'Ativo' ? 'estado-publicado' : 'estado-pendente'
					}">${estado}</span>`,
					`<div class="d-flex justify-content-center">
						<button
							data-rowindex="${index}"
							class="btn btn-sm btn-outline-primary table_button_edit_tag"
						>
							<i class="fa fa-edit"></i>
						</button>
					</div>`,
					`<div class="d-flex justify-content-center">
						<button
							data-rowindex="${index}"
							class="${toggleBtnClass} table_button_toggle_tag"
							title="${toggleTitle}"
						>
							<i class="${toggleIcon}"></i>
						</button>
					</div>`,
					`<div class="d-flex justify-content-center">
						<button
							data-rowindex="${index}"
							class="btn btn-sm btn-outline-danger table_button_delete_tag"
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
				const tag = filteredTags[rowIndex];
				beginEdit(tag);
			});

		jq(document)
			.off('click', '.table_button_edit_tag')
			.on('click', '.table_button_edit_tag', (/** @type {Event} */ event) => {
				const target = /** @type {HTMLElement} */ (event.currentTarget);
				const rowIndex = jq(target).data('rowindex');
				const tag = filteredTags[rowIndex];
				beginEdit(tag);
			});

		jq(document)
			.off('click', '.table_button_toggle_tag')
			.on('click', '.table_button_toggle_tag', (/** @type {Event} */ event) => {
				const target = /** @type {HTMLElement} */ (event.currentTarget);
				const rowIndex = jq(target).data('rowindex');
				const tag = filteredTags[rowIndex];
				toggleTagStatus(tag);
			});

		jq(document)
			.off('click', '.table_button_delete_tag')
			.on('click', '.table_button_delete_tag', (/** @type {Event} */ event) => {
				const target = /** @type {HTMLElement} */ (event.currentTarget);
				const rowIndex = jq(target).data('rowindex');
				const tag = filteredTags[rowIndex];
				openDeleteModal(tag);
			});

		table.draw();
	}

	function onFilterSubmit() {
		applyFilters();
	}

	/**
	 * @param {Tag | undefined} tag
	 */
	function beginEdit(tag) {
		if (!tag) return;
		tagForm = {
			id: tag.id_tag,
			nome: tag.nome ?? '',
			status: tag.status ?? 'Ativo'
		};
		isEditing = true;
		showStatus(null, null);
		scrollToForm();
	}

	function resetForm() {
		tagForm = { id: null, nome: '', status: 'Ativo' };
		isEditing = false;
		showStatus(null, null);
		focusInput();
	}

	function startNewTag() {
		resetForm();
		scrollToForm();
	}

	/**
	 * @param {Tag} tag
	 */
	function openDeleteModal(tag) {
		deleteModal = {
			open: true,
			tag
		};
	}

	function closeDeleteModal() {
		deleteModal = {
			open: false,
			tag: null
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

	async function saveTag() {
		if (!tagForm.nome.trim()) {
			showStatus('error', tf('divTags.errorGeneric', 'Não foi possível concluir a operação.', 'Unable to complete the operation.'));
			return;
		}

		isSaving = true;
		const payload = {
			nome: tagForm.nome.trim(),
			status: tagForm.status ?? 'Ativo'
		};
		const endpoint = tagForm.id
			? `/ep/portal_noticias/tags/${tagForm.id}`
			: '/ep/portal_noticias/tags';
		const method = tagForm.id ? 'PUT' : 'POST';

		try {
			const response = await fetch(endpoint, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				throw new Error('Erro ao guardar tag');
			}

			showStatus(
				'success',
				tagForm.id
					? tf('divTags.successUpdate', 'Tag atualizada com sucesso.', 'Tag updated successfully.')
					: tf('divTags.successCreate', 'Tag criada com sucesso.', 'Tag created successfully.')
			);
			resetForm();
			await loadTags();
		} catch (error) {
			console.error(error);
			showStatus('error', tf('divTags.errorGeneric', 'Não foi possível concluir a operação.', 'Unable to complete the operation.'));
		} finally {
			isSaving = false;
		}
	}

	/**
	 * @param {Tag | undefined} tag
	 */
	async function deleteTag(tag) {
		if (!tag) return;

		try {
			const response = await fetch(`/ep/portal_noticias/tags/${tag.id_tag}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error('Erro a eliminar tag');
			}

			showStatus(
				'success',
				tf('divTags.successDelete', 'Tag eliminada com sucesso.', 'Tag deleted successfully.')
			);
			if (isEditing && tagForm.id === tag.id_tag) {
				resetForm();
			}
			closeDeleteModal();
			tags = tags.filter((current) => current.id_tag !== tag.id_tag);
			applyFilters();
		} catch (error) {
			console.error(error);
			showStatus('error', tf('divTags.errorGeneric', 'Não foi possível concluir a operação.', 'Unable to complete the operation.'));
		}
	}

	/**
	 * @param {Tag | undefined} tag
	 */
	async function toggleTagStatus(tag) {
		if (!tag) return;
		const isActive = (tag.status ?? 'Ativo') === 'Ativo';
		const nextStatus = isActive ? 'Desativo' : 'Ativo';

		try {
			const response = await fetch(`/ep/portal_noticias/tags/${tag.id_tag}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ nome: tag.nome ?? '', status: nextStatus })
			});

			if (!response.ok) {
				throw new Error('Erro ao atualizar tag');
			}

			const successMessage =
				nextStatus === 'Ativo'
					? tf('divTags.successActivate', 'Tag ativada com sucesso.', 'Tag activated successfully.')
					: tf(
							'divTags.successDeactivate',
							'Tag desativada com sucesso.',
							'Tag deactivated successfully.'
					  );
			showStatus('success', successMessage);
			if (isEditing && tagForm.id === tag.id_tag) {
				tagForm = {
					...tagForm,
					status: nextStatus
				};
			}
			tags = tags.map((current) =>
				current.id_tag === tag.id_tag ? { ...current, status: nextStatus } : current
			);
			applyFilters();
		} catch (error) {
			console.error(error);
			showStatus('error', tf('divTags.errorGeneric', 'Não foi possível concluir a operação.', 'Unable to complete the operation.'));
		}
	}

	let items_breadcrum = $derived([
		{
			icon_class: 'fas fa-plus',
			url: '#',
			designacao: tf('divTags.nova', 'Nova Tag', 'New Tag'),
			function: startNewTag
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
						{tf('divTags.nome', 'Nome', 'Name')}
					</label>
					<input
						id="nomeInputFilter"
						type="text"
						class="form-control"
						placeholder={tf('divTags.nomePlaceholder', 'Ex: Eventos', 'e.g. Events')}
						bind:value={formFilter.nome}
					/>
				</div>

				<div class="col-md-3 col-lg-3">
					<label for="estadoInputFilter" class="filter-label">
						{tf('divTags.estado', 'Estado', 'Status')}
					</label>
					<select id="estadoInputFilter" class="form-control" bind:value={formFilter.estado}>
						<option value="">{tf('divTags.todos', 'Todos', 'All')}</option>
						<option value="Ativo">{tf('divTags.ativo', 'Ativo', 'Active')}</option>
						<option value="Desativo">{tf('divTags.desativo', 'Desativo', 'Inactive')}</option>
					</select>
				</div>

				<div class="col-md-3 col-lg-3 d-flex flex-column align-items-center align-items-md-start">
					<span class="filter-label d-block">&nbsp;</span>
					<button
						type="submit"
						class="btn btn-primary btn-sm filter-submit"
						style="margin-top: 0px; background-color: #00a4e6; border-color: #00a4e6;"
						aria-label={tf('divTags.pesquisar', 'Pesquisar', 'Search')}
					>
						<i class="fas fa-search"></i>
					</button>
				</div>
			</div>
		</form>
	</div>

	<section class="tag-form card" bind:this={formSectionEl}>
		<div class="card-body">
			<h5 class="card-title">
				{isEditing
					? tf('divTags.editarTitulo', 'Editar Tag', 'Edit Tag')
					: tf('divTags.criarTitulo', 'Criar Tag', 'Create Tag')}
			</h5>
			{#if statusMessage}
				<div
					class={`alert ${statusType === 'success' ? 'alert-success' : 'alert-danger'} mb-3`}
					role="alert"
				>
					{statusMessage}
				</div>
			{/if}
			<form onsubmit={preventDefault(saveTag)}>
				<div class="row">
					<div class="col-md-6 col-lg-5">
						<label for="tagNome" class="filter-label">
							{tf('divTags.nome', 'Nome', 'Name')}
						</label>
						<input
							id="tagNome"
							class="form-control"
							type="text"
							bind:value={tagForm.nome}
							placeholder={tf('divTags.nomePlaceholder', 'Ex: Eventos', 'e.g. Events')}
							bind:this={nomeInput}
							maxlength="120"
							required
						/>
					</div>
				</div>
				<div class="form-buttons mt-3">
					<button type="submit" class="btn btn-primary btn-sm" disabled={isSaving}>
						{isEditing
							? tf('divTags.atualizar', 'Atualizar', 'Update')
							: tf('divTags.guardar', 'Guardar', 'Save')}
					</button>
					{#if isEditing}
						<button
							type="button"
							class="btn btn-outline-secondary btn-sm"
							onclick={resetForm}
							disabled={isSaving}
						>
							{tf('divTags.cancelar', 'Cancelar', 'Cancel')}
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
			<h5>{tf('divTags.confirmDeleteTitle', 'Eliminar tag', 'Delete tag')}</h5>
			<p class="modal-text">
				{tf(
					'divTags.confirmDelete',
					'Tem a certeza que pretende eliminar esta tag? Esta ação não pode ser desfeita.',
					'Are you sure you want to delete this tag? This action cannot be undone.'
				)}
			</p>
			<div class="modal-actions">
				<button class="btn btn-sm btn-danger" onclick={() => deleteModal.tag && deleteTag(deleteModal.tag)}>
					{tf('divTags.confirmDeleteConfirm', 'Eliminar', 'Delete')}
				</button>
				<button class="btn btn-sm btn-outline-secondary" onclick={closeDeleteModal}>
					{tf('divTags.confirmDeleteCancel', 'Cancelar', 'Cancel')}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	@import '../portal_noticias.css';

	.tag-form {
		margin: 16px 24px;
		border: 1px solid #dde3ea;
		border-radius: 6px;
	}

	.tag-form .card-body {
		padding: 20px 24px;
	}

	.tag-form .card-title {
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


