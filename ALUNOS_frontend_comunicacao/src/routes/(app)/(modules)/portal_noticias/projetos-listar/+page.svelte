<script>
	import Breadcrum from '$lib/components/Breadcrum.svelte';
	import { locale, t } from '$lib/translations/translations';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import * as dt_pt from '$lib/translations/pt/datatables.json';
	import * as dt_en from '$lib/translations/en/datatables.json';
	import { configurePortalSidebar } from '../sidebar.config.js';
	import { sidebarOptions } from '$lib/runes/sidebarOptions.rune.svelte';
	import toastr from 'toastr';

	const translate = (key) => get(t)(key);
	configurePortalSidebar('projetos', translate);

	const globalWithJQuery = /** @type {any} */ (globalThis);
	const jq = globalWithJQuery?.jQuery ?? globalWithJQuery?.$;

	let loadingData = $state(true);
	let projetos = $state([]);
	let filtered = $state([]);

	let formFilter = $state({ assunto: '', estado: '' });

	let formProjeto = $state({ id_projeto: null, assunto: '', descricao: '', estado: 'Ativo' });
	let isEditing = $state(false);
	let isSaving = $state(false);
	let isFormModalOpen = $state(false);
	let deleteModal = $state({ open: false, projeto: null });

	let table = $state();
	let el = $state();

	const tableColumns = [
		{ title: 'Assunto', width: '30%' },
		{ title: 'Descrição', width: '35%' },
		{ title: 'Estado', width: '10%' },
		{ title: '', orderable: false, width: '10%' },
		{ title: '', orderable: false, width: '7.5%' },
		{ title: '', orderable: false, width: '7.5%' }
	];

	onMount(async () => {
		if (jq?.fn?.dataTable?.ext) {
			jq.fn.dataTable.ext.errMode = 'none';
		}

		await loadProjetos();

		table = jq(el).DataTable({
			dom: 'Bfrtip',
			columns: tableColumns,
			responsive: true,
			buttons: ['pageLength', 'pdf', 'csv', 'excel', 'copy', 'colvis'],
			pageLength: 25,
			order: [[0, 'asc']],
			language: locale.get() === 'pt' ? dt_pt : dt_en,
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

	async function loadProjetos() {
		try {
			loadingData = true;
			const data = await fetch('/ep/portal_noticias/projetos').then((d) => d.json());
			projetos = Array.isArray(data) ? data : [];
		} catch (error) {
			console.error('Erro ao carregar projetos', error);
			projetos = [];
			toastr.error('Não foi possível concluir a operação.', 'Erro');
		} finally {
			applyFilters();
			loadingData = false;
		}
	}

	function applyFilters() {
		const assuntoFilter = formFilter.assunto.toLowerCase().trim();
		filtered = projetos
			.filter((p) => {
				const nome = (p.assunto ?? '').toLowerCase();
				const matchesAssunto = assuntoFilter === '' || nome.includes(assuntoFilter);
				const matchesEstado =
					formFilter.estado === '' ||
					((p.estado ?? '').toLowerCase() === formFilter.estado.toLowerCase());
				return matchesAssunto && matchesEstado;
			})
			.sort((a, b) => (a.assunto ?? '').localeCompare(b.assunto ?? '', 'pt', { sensitivity: 'base' }));

		refreshTable();
	}

	function refreshTable() {
		if (!table) return;
		table.clear();

		filtered.forEach((projeto, index) => {
			const estado = projeto.estado || 'Ativo';
			const isActive = estado === 'Ativo';
			const toggleBtnClass = isActive ? 'btn btn-sm btn-outline-success' : 'btn btn-sm btn-outline-warning';
			const toggleIcon = isActive ? 'fa fa-toggle-on' : 'fa fa-toggle-off';
			const toggleTitle = isActive ? 'Desativar' : 'Ativar';

			table.row.add([
				`<div class="clickable-cell" data-rowindex="${index}">${projeto.assunto}</div>`,
				`<div class="clickable-cell" data-rowindex="${index}">${projeto.descricao ?? ''}</div>`,
				`<span class="estado ${isActive ? 'estado-publicado' : 'estado-pendente'}">${estado}</span>`,
				`<div class="d-flex justify-content-center">
					<button data-rowindex="${index}" class="btn btn-sm btn-outline-primary table_button_edit_projeto">
						<i class="fa fa-edit"></i>
					</button>
				</div>`,
				`<div class="d-flex justify-content-center">
					<button data-rowindex="${index}" class="${toggleBtnClass} table_button_toggle_projeto" title="${toggleTitle}">
						<i class="${toggleIcon}"></i>
					</button>
				</div>`,
				`<div class="d-flex justify-content-center">
					<button data-rowindex="${index}" class="btn btn-sm btn-outline-danger table_button_delete_projeto">
						<i class="fa fa-trash"></i>
					</button>
				</div>`
			]).node();
		});

		jq(el)
			.off('click', '.clickable-cell')
			.on('click', '.clickable-cell', (event) => {
				const target = /** @type {HTMLElement} */ (event.currentTarget);
				const rowIndex = jq(target).data('rowindex');
				beginEdit(filtered[rowIndex]);
			});

		jq(document)
			.off('click', '.table_button_edit_projeto')
			.on('click', '.table_button_edit_projeto', (event) => {
				const target = /** @type {HTMLElement} */ (event.currentTarget);
				const rowIndex = jq(target).data('rowindex');
				beginEdit(filtered[rowIndex]);
			});

		jq(document)
			.off('click', '.table_button_toggle_projeto')
			.on('click', '.table_button_toggle_projeto', async (event) => {
				const target = /** @type {HTMLElement} */ (event.currentTarget);
				const rowIndex = jq(target).data('rowindex');
				await toggleProjeto(filtered[rowIndex]);
			});

		jq(document)
			.off('click', '.table_button_delete_projeto')
			.on('click', '.table_button_delete_projeto', (event) => {
				const target = /** @type {HTMLElement} */ (event.currentTarget);
				const rowIndex = jq(target).data('rowindex');
				deleteModal = { open: true, projeto: filtered[rowIndex] };
			});

		table.draw(false);
	}

	function resetForm() {
		formProjeto = { id_projeto: null, assunto: '', descricao: '', estado: 'Ativo' };
		isEditing = false;
		isFormModalOpen = false;
	}

	function startNewProjeto() {
		resetForm();
		isFormModalOpen = true;
	}

	function beginEdit(projeto) {
		if (!projeto) return;
		formProjeto = {
			id_projeto: projeto.id_projeto,
			assunto: projeto.assunto ?? '',
			descricao: projeto.descricao ?? '',
			estado: projeto.estado ?? 'Ativo'
		};
		isEditing = true;
		isFormModalOpen = true;
	}

	async function saveProjeto() {
		if (!formProjeto.assunto.trim()) {
			toastr.warning('Assunto é obrigatório.', 'Aviso');
			return;
		}
		isSaving = true;
		const payload = {
			assunto: formProjeto.assunto.trim(),
			descricao: formProjeto.descricao ?? '',
			estado: formProjeto.estado || 'Ativo'
		};
		try {
			let resp;
			if (isEditing && formProjeto.id_projeto) {
				resp = await fetch(`/ep/portal_noticias/projetos?id=${formProjeto.id_projeto}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
			} else {
				resp = await fetch('/ep/portal_noticias/projetos', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
			}
			if (!resp.ok) {
				const body = await resp.text();
				throw new Error(body || 'Erro ao gravar projeto');
			}
			toastr.success('Guardado com sucesso.', 'Projetos');
			resetForm();
			await loadProjetos();
		} catch (err) {
			console.error(err);
			toastr.error('Não foi possível guardar o projeto.', 'Erro');
		} finally {
			isSaving = false;
		}
	}

	async function toggleProjeto(projeto) {
		if (!projeto?.id_projeto) return;
		const nextEstado = (projeto.estado ?? 'Ativo') === 'Ativo' ? 'Inativo' : 'Ativo';
		try {
			const resp = await fetch(`/ep/portal_noticias/projetos?id=${projeto.id_projeto}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					assunto: projeto.assunto,
					descricao: projeto.descricao,
					estado: nextEstado
				})
			});
			if (!resp.ok) throw new Error('Erro ao atualizar estado');
			await loadProjetos();
			toastr.success('Estado atualizado.', 'Projetos');
		} catch (err) {
			console.error(err);
			toastr.error('Não foi possível atualizar.', 'Erro');
		}
	}

	async function confirmarDelete() {
		if (!deleteModal.projeto?.id_projeto) return;
		try {
			const resp = await fetch(`/ep/portal_noticias/projetos?id=${deleteModal.projeto.id_projeto}`, {
				method: 'DELETE'
			});
			if (!resp.ok) throw new Error('Erro ao eliminar projeto');
			toastr.success('Projeto eliminado.', 'Projetos');
			deleteModal = { open: false, projeto: null };
			await loadProjetos();
		} catch (err) {
			console.error(err);
			toastr.error('Não foi possível eliminar.', 'Erro');
		}
	}

	let items_breadcrum = $derived([
		{
			icon_class: 'fas fa-plus',
			url: '#',
			designacao: 'Novo projeto',
			function: startNewProjeto
		}
	]);
</script>

<style>
	@import "../portal_noticias.css";
</style>

<Breadcrum
	modulo={sidebarOptions.currentModule}
	objeto={sidebarOptions.currentObject}
	menu_items={items_breadcrum}
/>

<div class="tableNews">
	<div class="row filter">
		<form class="w-100" on:submit|preventDefault={applyFilters}>
			<div class="row filter-row align-items-start g-3">
				<div class="col-md-4 col-lg-4">
					<label class="filter-label">Assunto</label>
					<input
						type="text"
						class="form-control"
						placeholder="Ex: Comunicação"
						bind:value={formFilter.assunto}
					/>
				</div>

				<div class="col-md-3 col-lg-3">
					<label class="filter-label">Estado</label>
					<select class="form-control" bind:value={formFilter.estado}>
						<option value="">Todos</option>
						<option value="Ativo">Ativo</option>
						<option value="Inativo">Inativo</option>
					</select>
				</div>

				<div class="col-md-3 col-lg-3 d-flex flex-column align-items-center align-items-md-start">
					<span class="filter-label d-block">&nbsp;</span>
					<button
						type="submit"
						class="btn btn-primary btn-sm filter-submit"
						style="margin-top: 0px; background-color: #00a4e6; border-color: #00a4e6;"
						aria-label="Pesquisar"
					>
						<i class="fas fa-search"></i>
					</button>
				</div>
			</div>
		</form>
	</div>

	<div id="defaultTable">
		<div id="conteudo_carregado">
			<div hidden={loadingData} class="row" id="modulepage_content" style="display: block">
				<div class="table-responsive">
					<table
						bind:this={el}
						class="datatable-on table-striped hover datatable table-sm nowrap no-footer dtr-inline w-100"
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

{#if isFormModalOpen}
	<div class="modal fade show d-block" style="background: rgba(0,0,0,0.35);">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title">{isEditing ? 'Editar projeto' : 'Novo projeto'}</h5>
					<button type="button" class="close" aria-label="Close" on:click={resetForm}>
						<span aria-hidden="true">&times;</span>
					</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label>Assunto<span style="color:red">*</span></label>
						<input class="form-control" bind:value={formProjeto.assunto} maxlength="255" />
					</div>
					<div class="form-group">
						<label>Descrição</label>
						<textarea class="form-control" rows="3" bind:value={formProjeto.descricao}></textarea>
					</div>
					<div class="form-group">
						<label>Estado</label>
						<select class="form-control" bind:value={formProjeto.estado}>
							<option value="Ativo">Ativo</option>
							<option value="Inativo">Inativo</option>
						</select>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-secondary" on:click={resetForm}>Cancelar</button>
					<button class="btn btn-primary" on:click={saveProjeto} disabled={isSaving}>
						{isSaving ? 'A guardar...' : 'Guardar'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if deleteModal.open}
	<div class="modal fade show d-block" style="background: rgba(0,0,0,0.35);">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title">Remover projeto</h5>
					<button type="button" class="close" aria-label="Close" on:click={() => deleteModal = { open: false, projeto: null }}>
						<span aria-hidden="true">&times;</span>
					</button>
				</div>
				<div class="modal-body">
					<p>Tem a certeza que pretende remover o projeto "{deleteModal.projeto?.assunto}"?</p>
				</div>
				<div class="modal-footer">
					<button class="btn btn-secondary" on:click={() => deleteModal = { open: false, projeto: null }}>Cancelar</button>
					<button class="btn btn-danger" on:click={confirmarDelete}>Remover</button>
				</div>
			</div>
		</div>
	</div>
{/if}

