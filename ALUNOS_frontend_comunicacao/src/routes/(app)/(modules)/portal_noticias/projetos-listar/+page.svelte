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

	let formFilter = $state({ assunto: '' });

	let table = $state();
	let el = $state();

	const tableColumns = [
		{ title: 'ID', width: '10%' },
		{ title: 'Assunto (Acronym)', width: '25%' },
		{ title: 'Descrição', width: '50%' },
		{ title: 'Data Criação', width: '15%' }
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
			order: [[0, 'desc']],
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
			// getJson já retorna os projetos do webservice real formatados
			const data = await fetch('/ep/portal_noticias/getJson').then((d) => d.json());
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
				return matchesAssunto;
			})
			.sort((a, b) => (a.assunto ?? '').localeCompare(b.assunto ?? '', 'pt', { sensitivity: 'base' }));

		refreshTable();
	}

	function refreshTable() {
		if (!table) return;
		table.clear();

		filtered.forEach((projeto) => {
			table.row.add([
				projeto.id_projeto,
				projeto.assunto,
				projeto.descricao ?? '',
				projeto.data_criacao ? new Date(projeto.data_criacao).toLocaleDateString('pt-PT') : '—'
			]).node();
		});

		table.draw(false);
	}

	let items_breadcrum = $derived([]);
</script>

<style>
	@import "../portal_noticias.css";

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
		padding: 4px 80px !important;
		border-radius: 4px;
		background-color: #00a4e6;
		border-color: #00a4e6;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin: 0 !important;
	}

	.filter-submit i {
		font-size: 15px;
	}
</style>

<Breadcrum
	modulo={sidebarOptions.currentModule}
	objeto={sidebarOptions.currentObject}
	menu_items={items_breadcrum}
/>

<div class="tableNews">
	<div class="row filter">
		<form class="w-100" onsubmit={(e) => { e.preventDefault(); applyFilters(); }}>
			<div class="row filter-row align-items-start g-3">
				<div class="col-md-8">
					<label class="filter-label">Assunto (Acronym)</label>
					<input
						type="text"
						class="form-control"
						placeholder="Ex: Revitagri"
						bind:value={formFilter.assunto}
					/>
				</div>

				<div class="col-md-4 d-flex flex-column align-items-center align-items-md-start">
					<span class="filter-label d-block">&nbsp;</span>
					<button
						type="submit"
						class="btn btn-primary btn-sm filter-submit"
						style="margin: 0 !important;"
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
