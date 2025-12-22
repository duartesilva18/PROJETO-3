<script>
	import Breadcrum from '$lib/components/Breadcrum.svelte';
	import { sidebarOptions } from '$lib/runes/sidebarOptions.rune.svelte';
	import { configurePortalSidebar } from '../sidebar.config.js';
	import { locale, t } from '$lib/translations/translations';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	import Chart from 'chart.js';

	const tf = (key) => get(t)(key);
	const translate = (key) => get(t)(key);
	configurePortalSidebar('estatisticas', translate);

	let loading = $state(true);

	let filtros = $state({
		ano: ''
	});

	let noticias = $state([]);
let radios = $state([]);

	function filtrarNoticias() {
		let lista = noticias;

		if (filtros.ano) {
			lista = lista.filter((n) => {
				if (!n.data_criacao) return false;
				const ano = new Date(n.data_criacao).getFullYear().toString();
				return ano === filtros.ano;
			});
		}

		return lista;
	}

	function calcularKPIs() {
		const lista = filtrarNoticias().filter((n) => n.estado !== 'eliminada');

		const total = lista.length;
		const publicados = lista.filter((n) => n.estado === 'Publicado').length;
		const midia = lista.filter((n) => n.tipo === 1).length;

		const radiosSet = new Set();
		lista.forEach((n) => {
			if (!n.emails) return;
			n.emails
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean)
				.forEach((id) => radiosSet.add(id));
		});
		const radiosDistintos = radiosSet.size;

		return { total, publicados, midia, radiosDistintos };
	}

	let anosDisponiveis = $state([]);

	onMount(async () => {
		try {
			const [dados, radiosData] = await Promise.all([
				fetch('/ep/portal_noticias/dados').then((d) => d.json()),
				fetch('/ep/portal_noticias/radio_jornal').then((d) => d.json())
			]);

			noticias = Array.isArray(dados) ? dados : [];
			radios = Array.isArray(radiosData) ? radiosData : [];

			const anosSet = new Set(
				noticias
					.filter((n) => n.data_criacao)
					.map((n) => new Date(n.data_criacao).getFullYear().toString())
			);
			anosDisponiveis = Array.from(anosSet).sort().reverse();
		} catch (e) {
			console.error('Erro a carregar estatísticas de notícias', e);
		} finally {
			loading = false;
		}
	});

	let kpis = $derived(calcularKPIs());

	// Sem botões extra no breadcrumb para esta página
	let items_breadcrum = $derived([]);

let dashboardVisible = $state(true);

function toggleDashboard() {
	dashboardVisible = !dashboardVisible;
	if (dashboardVisible && !loading) {
		updateCharts();
	}
}

let estadoChartCanvas;
let categoriaChartCanvas;
let mesChartCanvas;
let midiaMesChartCanvas;
let tipoChartCanvas;
let topRadiosChartCanvas;
let estadoChart;
let categoriaChart;
let mesChart;
let midiaMesChart;
let tipoChart;
let topRadiosChart;

function buildEstadoData(lista) {
	const counts = {
		Pendente: 0,
		Publicado: 0,
		Outros: 0
	};

	lista.forEach((n) => {
		if (n.estado === 'Pendente') counts.Pendente += 1;
		else if (n.estado === 'Publicado') counts.Publicado += 1;
		else counts.Outros += 1;
	});

	return counts;
}

function buildCategoriaData(lista) {
	const mapa = new Map();
	lista.forEach((n) => {
		const nome = n.pn_categoria?.nome || 'Sem categoria';
		mapa.set(nome, (mapa.get(nome) || 0) + 1);
	});

	const labels = Array.from(mapa.keys());
	const values = Array.from(mapa.values());
	return { labels, values };
}

function buildMesData(lista) {
	const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
	const counts = new Array(12).fill(0);

	lista.forEach((n) => {
		if (!n.data_criacao) return;
		const d = new Date(n.data_criacao);
		const m = d.getMonth();
		if (!Number.isNaN(m)) {
			counts[m] += 1;
		}
	});

	return { labels: meses, values: counts };
}

function buildTipoData(lista) {
	const midia = lista.filter((n) => n.tipo === 1).length;
	const normal = lista.length - midia;
	return { midia, normal };
}

function buildTopRadiosData(lista, maxItems = 5) {
	const mapa = new Map();

	lista
		.filter((n) => n.tipo === 1 && n.emails)
		.forEach((n) => {
			n.emails
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean)
				.forEach((id) => {
					mapa.set(id, (mapa.get(id) || 0) + 1);
				});
		});

	const entries = Array.from(mapa.entries()).sort((a, b) => b[1] - a[1]).slice(0, maxItems);
	const labels = entries.map(([id]) => {
		const radio = radios.find((r) => String(r.id_radio_jornal) === String(id));
		return radio?.nome || id;
	});
	const values = entries.map(([, count]) => count);

	return { labels, values };
}

function updateCharts() {
	if (!dashboardVisible) return;
	const lista = filtrarNoticias().filter((n) => n.estado !== 'eliminada');
	const midiaLista = lista.filter((n) => n.tipo === 1);

	if (
		!estadoChartCanvas ||
		!categoriaChartCanvas ||
		!mesChartCanvas ||
		!midiaMesChartCanvas ||
		!tipoChartCanvas ||
		!topRadiosChartCanvas
	)
		return;

	const estadoData = buildEstadoData(lista);
	const categoriaData = buildCategoriaData(lista);
	const mesData = buildMesData(lista);
	const mesMidiaData = buildMesData(midiaLista);
	const tipoData = buildTipoData(lista);
	const topRadiosData = buildTopRadiosData(midiaLista);

	if (estadoChart) {
		estadoChart.destroy();
	}
	if (categoriaChart) {
		categoriaChart.destroy();
	}
	if (mesChart) {
		mesChart.destroy();
	}
	if (midiaMesChart) {
		midiaMesChart.destroy();
	}
	if (tipoChart) {
		tipoChart.destroy();
	}
	if (topRadiosChart) {
		topRadiosChart.destroy();
	}

	const baseOptions = {
		legend: {
			labels: { fontFamily: 'inherit' }
		},
		maintainAspectRatio: false,
		responsive: true,
		devicePixelRatio: 2, // melhora nitidez em ecrãs retina
		animation: false
	};

	estadoChart = new Chart(estadoChartCanvas, {
		type: 'doughnut',
		data: {
			labels: ['Pendente', 'Publicado', 'Outros'],
			datasets: [
				{
					data: [estadoData.Pendente, estadoData.Publicado, estadoData.Outros],
					backgroundColor: ['#ffb74d', '#66bb6a', '#90a4ae']
				}
			]
		},
		options: {
			...baseOptions,
			cutoutPercentage: 60
		}
	});

	categoriaChart = new Chart(categoriaChartCanvas, {
		type: 'bar',
		data: {
			labels: categoriaData.labels,
			datasets: [
				{
					label: 'N.º notícias',
					data: categoriaData.values,
					backgroundColor: '#26c6da'
				}
			]
		},
		options: {
			...baseOptions,
			scales: {
				yAxes: [
					{
						ticks: {
							beginAtZero: true,
							stepSize: 1
						}
					}
				]
			}
		}
	});

	mesChart = new Chart(mesChartCanvas, {
		type: 'line',
		data: {
			labels: mesData.labels,
			datasets: [
				{
					label: 'Notícias por mês',
					data: mesData.values,
					borderColor: '#42a5f5',
					backgroundColor: 'rgba(66, 165, 245, 0.15)',
					fill: true,
					lineTension: 0.2,
					pointRadius: 3
				}
			]
		},
		options: {
			...baseOptions,
			scales: {
				yAxes: [
					{
						ticks: {
							beginAtZero: true,
							stepSize: 1
						}
					}
				]
			}
		}
	});

	midiaMesChart = new Chart(midiaMesChartCanvas, {
		type: 'line',
		data: {
			labels: mesMidiaData.labels,
			datasets: [
				{
					label: 'Mídias por mês',
					data: mesMidiaData.values,
					borderColor: '#ef5350',
					backgroundColor: 'rgba(239, 83, 80, 0.15)',
					fill: true,
					lineTension: 0.2,
					pointRadius: 3
				}
			]
		},
		options: {
			...baseOptions,
			scales: {
				yAxes: [
					{
						ticks: {
							beginAtZero: true,
							stepSize: 1
						}
					}
				]
			}
		}
	});

	tipoChart = new Chart(tipoChartCanvas, {
		type: 'doughnut',
		data: {
			labels: ['Notícia normal', 'Mídia'],
			datasets: [
				{
					data: [tipoData.normal, tipoData.midia],
					backgroundColor: ['#42a5f5', '#ef5350']
				}
			]
		},
		options: {
			...baseOptions,
			cutoutPercentage: 55
		}
	});

	topRadiosChart = new Chart(topRadiosChartCanvas, {
		type: 'bar',
		data: {
			labels: topRadiosData.labels,
			datasets: [
				{
					label: 'N.º de Mídias',
					data: topRadiosData.values,
					backgroundColor: '#ab47bc'
				}
			]
		},
		options: {
			...baseOptions,
			scales: {
				yAxes: [
					{
						ticks: {
							beginAtZero: true,
							stepSize: 1
						}
					}
				]
			}
		}
	});
}

$effect(() => {
	if (!loading) {
		updateCharts();
	}
});
</script>

<Breadcrum
	modulo={sidebarOptions.currentModule}
	objeto={sidebarOptions.currentObject}
	menu_items={items_breadcrum}
/>

<div class="tableNews mt-2">
	<div class="row filter">
		<form on:submit|preventDefault class="w-100">
			<div class="row filter-row align-items-start g-3">
				<!-- ANO -->
				<div class="col-md-3 col-lg-3">
					<label class="filter-label">Ano</label>
					<select class="form-control" bind:value={filtros.ano}>
						<option value="">Todos</option>
						{#each anosDisponiveis as ano}
							<option value={ano}>{ano}</option>
						{/each}
					</select>
				</div>

				<!-- BOTÃO PESQUISAR, À DIREITA (só visual, filtro é reativo) -->
				<div class="col-md-3 col-lg-3 d-flex flex-column align-items-center align-items-md-start">
					<span class="filter-label d-block">&nbsp;</span>
					<button
						type="submit"
						class="btn btn-primary btn-sm filter-submit"
						style="margin-top: 0px; background-color: #00a4e6; border-color: #00a4e6;"
						aria-label={tf('divNoticias.btPesquisar')}
					>
						<i class="fas fa-search"></i>
					</button>
				</div>
			</div>
		</form>
	</div>

	<div class="row mt-4 kpi-row">
		<div class="col-md-3">
			<div class="kpi-card gradient-1">
				<div class="kpi-value">{kpis.total}</div>
				<div class="kpi-label">Total de Notícias</div>
			</div>
		</div>
		<div class="col-md-3">
			<div class="kpi-card gradient-2">
				<div class="kpi-value">{kpis.publicados}</div>
				<div class="kpi-label">Notícias Publicadas</div>
			</div>
		</div>
		<div class="col-md-3">
			<div class="kpi-card gradient-3">
				<div class="kpi-value">{kpis.midia}</div>
				<div class="kpi-label">Notícias de Mídia</div>
			</div>
		</div>
		<div class="col-md-3">
			<div class="kpi-card gradient-4">
				<div class="kpi-value">{kpis.radiosDistintos}</div>
				<div class="kpi-label">Rádios/Jornais distintos</div>
			</div>
		</div>
	</div>

	<div class="row mt-3">
		<div class="col-12 d-flex align-items-center">
			<button
				type="button"
				class="btn btn-outline-info btn-sm dashboard-toggle-btn"
				on:click={toggleDashboard}
			>
				<i class="fas fa-chart-pie mr-1"></i>
				{dashboardVisible ? 'Ocultar dashboard' : 'Mostrar dashboard'}
			</button>
		</div>
	</div>

	{#if dashboardVisible}
		<div class="row mt-4">
			<div class="col-12">
				<h4 class="section-title">Informações gerais</h4>
				<div class="row mt-3">
					<div class="col-md-6 mb-3">
						<div class="chart-card">
							<div class="chart-title">Distribuição por estado</div>
							<div class="chart-wrapper">
								<canvas bind:this={estadoChartCanvas}></canvas>
							</div>
						</div>
					</div>
					<div class="col-md-6 mb-3">
						<div class="chart-card">
							<div class="chart-title">Notícias por categoria</div>
							<div class="chart-wrapper">
								<canvas bind:this={categoriaChartCanvas}></canvas>
							</div>
						</div>
					</div>
				</div>
				<div class="row mt-3">
					<div class="col-md-6 mb-3">
						<div class="chart-card">
							<div class="chart-title">Notícias normais vs Mídia</div>
							<div class="chart-wrapper">
								<canvas bind:this={tipoChartCanvas}></canvas>
							</div>
						</div>
					</div>
					<div class="col-md-6 mb-3">
						<div class="chart-card">
							<div class="chart-title">Top rádios/jornais (Mídia)</div>
							<div class="chart-wrapper">
								<canvas bind:this={topRadiosChartCanvas}></canvas>
							</div>
						</div>
					</div>
				</div>
				<div class="row mt-3">
					<div class="col-md-6 mb-3">
						<div class="chart-card">
							<div class="chart-title">Notícias por mês</div>
							<div class="chart-wrapper">
								<canvas bind:this={mesChartCanvas}></canvas>
							</div>
						</div>
					</div>
					<div class="col-md-6 mb-3">
						<div class="chart-card">
							<div class="chart-title">Mídias por mês</div>
							<div class="chart-wrapper">
								<canvas bind:this={midiaMesChartCanvas}></canvas>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="row mt-4">
			<div class="col-12">
				<p class="dashboard-hidden-text">O dashboard está ocultado.</p>
			</div>
		</div>
	{/if}

	{#if loading}
		<div class="loading-area">
			<div class="spinner-border text-primary" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
		</div>
	{/if}
</div>

<style>
	@import '../portal_noticias.css';

	.filter-row {
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

	.kpi-row {
		margin-top: 16px;
	}

	.kpi-card {
		border-radius: 8px;
		padding: 18px 20px;
		color: #0b3c5d;
		box-shadow: 0 6px 16px rgba(15, 35, 52, 0.15);
		background: linear-gradient(135deg, #e0f3ff 0%, #c3e4ff 50%, #f5fbff 100%);
	}

	/* Todos os cards usam o mesmo gradiente do primeiro */
	.kpi-card.gradient-2,
	.kpi-card.gradient-3,
	.kpi-card.gradient-4 {
		background: linear-gradient(135deg, #e0f3ff 0%, #c3e4ff 50%, #f5fbff 100%);
	}

	.kpi-value {
		font-size: 28px;
		font-weight: 700;
		margin-bottom: 4px;
	}

	.kpi-label {
		font-size: 13px;
		font-weight: 500;
		color: #4c6377;
	}

	.loading-area {
		margin-top: 20px;
		display: flex;
		justify-content: center;
	}

	.section-title {
		font-size: 18px;
		font-weight: 600;
		margin-top: 8px;
		margin-bottom: 4px;
	}

	.dashboard-hidden-text {
		font-size: 14px;
		color: #7f8b99;
		font-style: italic;
	}

	.chart-card {
		background: #ffffff;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(15, 35, 52, 0.12);
		padding: 12px 16px 16px;
		height: 100%;
	}

	.chart-title {
		font-size: 14px;
		font-weight: 600;
		margin-bottom: 8px;
		color: #4c6377;
	}

	.chart-wrapper {
		position: relative;
		height: 260px;
	}
</style>


