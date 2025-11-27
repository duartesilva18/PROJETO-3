<script>
	// @ts-nocheck
	import { goto } from '$app/navigation';
	import Breadcrum from '$lib/components/Breadcrum.svelte';
	import { t } from '$lib/translations/translations';
	import { onMount } from 'svelte';
	import PublicarNoticia from './modals/PublicarNoticia.svelte';
	import RemoveModal from '../../noticia/[id]/modals/RemoveModal.svelte';
	import Modal from './Modal.svelte';
	import FacebookPreview from './modals/FacebookPreview.svelte';
	import TwitterPreview from './modals/TwitterPreview.svelte';
	import InstagramPreview from './modals/InstagramPreview.svelte';
	import LinkedinPreview from './modals/LinkedinPreview.svelte';
	import TiktokPreview from './modals/TiktokPreview.svelte';
	import { derived } from 'svelte/store';

	import { page } from '$app/stores';
	import { get } from 'svelte/store';
import { configurePortalSidebar } from '../../sidebar.config.js';

	
	

	// titulo da pÃ¡gina


	// Extraia o id da notÃ­cia dos parÃ¢metros da rota
const translate = (key) => get(t)(key);
configurePortalSidebar('dashboard', translate);

const breadcrumModuleName = 'GestÃ£o de NotÃ­cias';
const breadcrumPageName = 'Detalhe da NotÃ­cia';

const noticiaId = $page.params.id;
	
let currentImageIndex = $state(0);
let currentVideoIndex = $state(0);
let noticiaSelecionada = $state();
let redesSocial = $state([]);
let pedidos = $state([]);
let radios_jornais = $state([]);
let pedidoassunto = $state('');
let selectedSocialNetwork = $state('bacx');
let resultString = $state('');
let showPopup = $state(false);
let showPublish = $state(false);

let removeModalBind = $state();

	function handleSelect(noticia) {
		noticiaSelecionada = noticia;
		showPublish = true;
	}

	const onPopupClose = (data) => {
		showPopup = false;
		showPublish= false;
	};

	const icones = {
		Facebook: 'fab fa-facebook-f',
		Twitter: 'fab fa-twitter',
		Instagram: 'fab fa-instagram',
		LinkedIn: 'fab fa-linkedin-in',
		Tiktok: 'fab fa-tiktok'
	};

	const socialColors = {
        Facebook: '#3b5998', // Facebook Blue
        Twitter: '#1DA1F2',  // Twitter Blue
        Instagram: 'linear-gradient(45deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C, #FD1D1D)', // Instagram Gradient
        Linkedin: '#0077B5', // LinkedIn Blue
        Tiktok: '#69C9D0'    // TikTok Blue
    };

	onMount(async () => {
		try {
			redesSocial = await fetch('/ep/portal_noticias/redes').then((d) => d.json());
			noticiaSelecionada = await fetch(`/ep/portal_noticias/noticia?id=${noticiaId}`).then((d) => d.json());
			pedidos = await fetch('/ep/portal_noticias/getJson').then((d) => d.json());
			radios_jornais = await fetch('/ep/portal_noticias/radio_jornal').then((d) => d.json());
			currentImageIndex = 0;
			currentVideoIndex = 0;
			updateVideo();
	       
			const idsEmails = noticiaSelecionada.emails.split(',');
			const matchedRadiosJornais = radios_jornais.filter(item => idsEmails.includes(item.id_radio_jornal));
			resultString = matchedRadiosJornais
            .map(item => `${item.nome}`)
            .join(', ');

			
			

			pedidoassunto = pedidos.find(p => p.id === noticiaSelecionada.id_pedido).assunto;

			console.log(pedidoassunto)
		
			redesSocial.forEach((rede) => {
				rede.icone = icones[rede.nome];
			});
		} catch (error) {
			console.error('Erro ao buscar notÃ­cia:', error);
		}
	});

	

	async function publicarNoticia() {
		console.log("publicar noticia clicado!")
		handleSelect(noticiaSelecionada);
		console.log("Show Publish State After handleSelect:", showPublish);
	}

	function nextImage() {
		const imagens = getImageAttachments();
		if (currentImageIndex < imagens.length - 1) {
			currentImageIndex++;
		}
	}

	function previousImage() {
		if (currentImageIndex > 0) {
			currentImageIndex--;
		}
	}
	
let videoElement = $state(); // ReferÃªncia ao elemento de vÃ­deo

	function nextVideo() {
		const videos = getVideoAttachments();
		if (currentVideoIndex < videos.length - 1) {
			currentVideoIndex += 1;
			updateVideo(); // Atualiza o vÃ­deo
		}
	}

	function prevVideo() {
		if (currentVideoIndex > 0) {
			currentVideoIndex -= 1;
			updateVideo(); // Atualiza o vÃ­deo
		}
	}

	// ForÃ§a o carregamento do vÃ­deo novo
	function updateVideo() {
    	if (videoElement) {
			const videos = getVideoAttachments();
			const currentVideo = videos[currentVideoIndex];
			if (!currentVideo) return;
			videoElement.src = `/ep/portal_noticias/getFileById?id=${currentVideo.id_anexo}`;
			videoElement.type = currentVideo.tipo;
			videoElement.load(); // ForÃ§a o navegador a recarregar o vÃ­deo
		}
	}	

	function getImageAttachments() {
		return noticiaSelecionada?.pn_anexos?.filter((anexo) => anexo.tipo?.startsWith('image/')) ?? [];
	}

	function getVideoAttachments() {
		return noticiaSelecionada?.pn_anexos?.filter((anexo) => anexo.tipo?.startsWith('video/')) ?? [];
	}

	function getFileAttachments() {
		return (
			noticiaSelecionada?.pn_anexos?.filter(
				(anexo) => !anexo.tipo?.startsWith('image/') && !anexo.tipo?.startsWith('video/')
			) ?? []
		);
	}

	let imageAttachments = $derived(() => getImageAttachments());
	let videoAttachments = $derived(() => getVideoAttachments());
	let fileAttachments = $derived(() => getFileAttachments());

	$effect(() => {
		if (imageAttachments.length === 0 && currentImageIndex !== 0) {
			currentImageIndex = 0;
		} else if (imageAttachments.length > 0 && currentImageIndex > imageAttachments.length - 1) {
			currentImageIndex = imageAttachments.length - 1;
		}
	});

	$effect(() => {
		if (videoAttachments.length === 0 && currentVideoIndex !== 0) {
			currentVideoIndex = 0;
		} else if (videoAttachments.length > 0 && currentVideoIndex > videoAttachments.length - 1) {
			currentVideoIndex = videoAttachments.length - 1;
			updateVideo();
		}
	});

	function getSocialButtonStyle(redeName) {
        const color = socialColors[redeName];
        if (color) {
            return redeName === 'Instagram'
                ? `background: transparent; -webkit-background-clip: text; color: transparent; background-image: ${color};` // Gradient text for Instagram
                : `color: ${color}; background: transparent;`; // Solid color for others
        }
        return 'color: #ccc; background: transparent;'; // Default gray if no match
    }


	function handleClick(rede) {
		selectedSocialNetwork = rede.nome;
		console.log(rede);

		console.log('Rede:' + selectedSocialNetwork);
		
		console.log(' rede fk :' + rede.id_rede_social_FK);
		showPopup = true;
	}

	function handleBack() {
		goto('/portal_noticias');
	}

	function formatDate(dateString) {
		const date = new Date(dateString);
		return date.toLocaleDateString('pt-BR', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatDateTime(dateString) {
		if (!dateString) return 'â€”';
		const date = new Date(dateString);
		return date.toLocaleString('pt-PT', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
	function getNomeRedeSocialById(id) {
		// Certifique-se de que o tipo de 'id' corresponde ao tipo de 'rede.id_rede_social'
		const rede = redesSocial.find((rede) => rede.id_rede_social === id);
		if (rede) {
			return rede;
		} else {
			console.error('Rede social nÃ£o encontrada para o ID:', id);
			return null; // Ou maneje o erro conforme necessÃ¡rio
		}
	}

	function onHandleSubmit(e) {
		e.preventDefault();
		console.log(formField);
		return;
	}

	function createNoticia() {
		if(noticiaSelecionada.tipo === 0){
			goto(`/portal_noticias/criar`);
		}else if(noticiaSelecionada.tipo === 1){
			goto(`/portal_noticias/criarmedia`);
		}
		
	
	}

	function editNoticia() {
		if(noticiaSelecionada.estado !== "Publicado"){
			if(noticiaSelecionada.tipo === 0){
				goto(`/portal_noticias/editar/${noticiaId}`);
			}else if(noticiaSelecionada.tipo === 1){
				goto(`/portal_noticias/editarmedia/${noticiaId}`);
			}

		}
		
	
	}

	function deleteNoticia() {
		const modal = get(modalStore);
		if (modal && modal.onOpenModal) {
			modal.onOpenModal(noticiaSelecionada);
		} else {
			console.error('RemoveModal nÃ£o estÃ¡ disponÃ­vel');
			alert('Erro: RemoveModal nÃ£o estÃ¡ disponÃ­vel. Por favor, recarregue a pÃ¡gina.');
		}
	}

	function onDeleteRow() {
		goto('/portal_noticias');
	}

let items_breadcrum = $derived([
	{
		icon_class: 'fas fa-arrow-left',
		url: '#',
		designacao: $t('divNoticias.back'),
		function: handleBack
	}
]);
</script>

{#if noticiaSelecionada}
	<!-- Verifica se noticia nÃ£o estÃ¡ vazio -->
	<Breadcrum
		modulo={breadcrumModuleName}
		objeto={breadcrumPageName}
		menu_items={items_breadcrum}
	/>

	<div class="detail-shell">
		<section class="detail-hero-card">
			<div class="hero-text">
				<p class="hero-eyebrow">{$t('divNoticias.noticia')} #{noticiaSelecionada.id_noticia}</p>
				<h1 class="hero-title">{noticiaSelecionada.titulo}</h1>
				{#if noticiaSelecionada.descricao}
					<p class="hero-summary">{noticiaSelecionada.descricao}</p>
				{/if}
				<div class="hero-tags">
					<span class="chip chip-status {noticiaSelecionada.estado}">
						{noticiaSelecionada.estado}
					</span>
					<span class="chip chip-type">{noticiaSelecionada.tipo === 1 ? 'Media' : 'Portal'}</span>
				</div>
				<p class="hero-date">
					{$t('divNoticias.dataCriacao')}: {formatDateTime(noticiaSelecionada.data_criacao)}
				</p>
			</div>
			<div class="hero-meta">
				<div class="hero-meta-item">
					<span>{$t('divNoticias.categoria')}</span>
					<strong>{noticiaSelecionada.pn_categoria?.nome ?? 'â€”'}</strong>
				</div>
				<div class="hero-meta-item">
					<span>{$t('divNoticias.Pedido')}</span>
					<strong>{pedidoassunto ?? 'â€”'}</strong>
				</div>
				<div class="hero-meta-item">
					<span>Tipo</span>
					<strong>{noticiaSelecionada.tipo === 1 ? 'Media' : 'Portal'}</strong>
				</div>
			</div>
		</section>

		<section class="stat-grid">
			<div class="stat-card">
				<p class="stat-label">Criada em</p>
				<p class="stat-value">{formatDateTime(noticiaSelecionada.data_criacao)}</p>
			</div>
			<div class="stat-card">
				<p class="stat-label">Atualizada em</p>
				<p class="stat-value">{formatDateTime(noticiaSelecionada.data_atualizacao ?? noticiaSelecionada.data_update)}</p>
			</div>
			<div class="stat-card">
				<p class="stat-label">Publicada em</p>
				<p class="stat-value">{formatDateTime(noticiaSelecionada.data_publicacao)}</p>
			</div>
			<div class="stat-card">
				<p class="stat-label">Destino</p>
				<p class="stat-value">
					{noticiaSelecionada.tipo === 1 ? resultString || 'â€”' : noticiaSelecionada.pn_categoria?.nome ?? 'â€”'}
				</p>
			</div>
		</section>

		<section class="detail-content-grid">
			<article class="detail-card narrative-card">
				<header class="card-header">
					<h4>{$t('divNoticias.Texto')}</h4>
				</header>
				<div class="narrative-body">
					{#if noticiaSelecionada.texto}
						{#each noticiaSelecionada.texto.split('\\n') as paragrafo, index (index)}
							{#if paragrafo.trim().length > 0}
								<p>{paragrafo}</p>
							{/if}
						{/each}
					{:else}
						<p class="muted">{ $t('divNoticias.semConteudo') || 'Sem conteÃºdo disponÃ­vel.' }</p>
					{/if}
				</div>
			</article>

			<article class="detail-card meta-card">
				<header class="card-header">
					<h4>InformaÃ§Ã£o geral</h4>
				</header>
				<dl class="meta-list">
					<div>
						<dt>{$t('divNoticias.estado')}</dt>
						<dd>{noticiaSelecionada.estado}</dd>
					</div>
					<div>
						<dt>{$t('divNoticias.Pedido')}</dt>
						<dd>{pedidoassunto ?? 'â€”'}</dd>
					</div>
					<div>
						<dt>{$t('divNoticias.categoria')}</dt>
						<dd>{noticiaSelecionada.pn_categoria?.nome ?? 'â€”'}</dd>
					</div>
					<div>
						<dt>Tipo</dt>
						<dd>{noticiaSelecionada.tipo === 1 ? 'Media' : 'Portal'}</dd>
					</div>
					<div>
						<dt>DestinatÃ¡rios</dt>
						<dd>{noticiaSelecionada.tipo === 1 ? resultString || 'â€”' : '-'}</dd>
					</div>
				</dl>
			</article>
		</section>

		{#if imageAttachments.length > 0 || videoAttachments.length > 0}
			<section class="media-duo">
				{#if imageAttachments.length > 0}
					<article class="detail-card media-card">
						<header class="card-header">
							<div>
								<h4>Galeria</h4>
								<p class="muted">Imagem {currentImageIndex + 1} de {imageAttachments.length}</p>
							</div>
							<div class="media-controls">
								<button
									type="button"
									class="ghost-btn"
									aria-label="Imagem anterior"
									onclick={previousImage}
									disabled={currentImageIndex === 0}
								>
									<i class="fas fa-chevron-left"></i>
								</button>
								<button
									type="button"
									class="ghost-btn"
									aria-label="Imagem seguinte"
									onclick={nextImage}
									disabled={currentImageIndex === imageAttachments.length - 1}
								>
		 							<i class="fas fa-chevron-right"></i>
								</button>
							</div>
						</header>
						<div class="media-frame">
							<img
								src={`/ep/portal_noticias/getFileById?id=${imageAttachments[currentImageIndex].id_anexo}`}
								alt={imageAttachments[currentImageIndex].nome ?? 'Imagem da notÃ­cia'}
							/>
						</div>
					</article>
				{/if}

				{#if videoAttachments.length > 0}
					<article class="detail-card media-card">
						<header class="card-header">
							<div>
								<h4>VÃ­deos</h4>
								<p class="muted">VÃ­deo {currentVideoIndex + 1} de {videoAttachments.length}</p>
							</div>
							<div class="media-controls">
								<button
									type="button"
									class="ghost-btn"
									aria-label="Vídeo anterior"
									onclick={prevVideo}
									disabled={currentVideoIndex === 0}
								>
									<i class="fas fa-chevron-left"></i>
								</button>
								<button
									type="button"
									class="ghost-btn"
									aria-label="Próximo vídeo"
									onclick={nextVideo}
									disabled={currentVideoIndex === videoAttachments.length - 1}
								>
									<i class="fas fa-chevron-right"></i>
								</button>
							</div>
						</header>
						<div class="media-frame video-frame">
							<!-- svelte-ignore a11y_media_has_caption -->
							<video controls bind:this={videoElement}>
								<source
									src={`/ep/portal_noticias/getFileById?id=${videoAttachments[currentVideoIndex].id_anexo}`}
									type={videoAttachments[currentVideoIndex].tipo}
								/>
								O navegador nÃ£o suporta a tag de vÃ­deo.
							</video>
						</div>
					</article>
				{/if}
			</section>
		{/if}

		{#if fileAttachments.length > 0}
			<section class="detail-card attachments-card">
				<header class="card-header">
					<h4>Ficheiros anexados</h4>
				</header>
				<ul class="attachment-list">
					{#each fileAttachments as anexo}
						<li class="attachment-item">
							<div>
								<p class="attachment-name">{anexo.nome_original_ficheiro ?? anexo.nome}</p>
								<span class="attachment-type">{anexo.tipo}</span>
							</div>
							<a
								class="ghost-btn"
								aria-label={`Descarregar ${anexo.nome_original_ficheiro ?? anexo.nome}`}
								href={`/ep/portal_noticias/getFileById?id=${anexo.id_anexo}`}
								target="_blank"
								rel="noopener"
							>
								<i class="fas fa-download"></i>
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if noticiaSelecionada.pn_rs_noticia && noticiaSelecionada.pn_rs_noticia.length > 0}
			<section class="detail-card social-board">
				<header class="card-header">
					<h4>PublicaÃ§Ãµes nas redes sociais</h4>
					<p class="muted">Clique para prÃ©-visualizar</p>
				</header>
				<div class="social-list">
					{#each noticiaSelecionada.pn_rs_noticia as rede}
						{@const redeInfo = getNomeRedeSocialById(rede.id_rede_social_FK) ?? { nome: 'Rede' }}
						<button type="button" class="social-item" onclick={() => handleClick(redeInfo)}>
							<div>
								<p class="social-name">{redeInfo.nome}</p>
								<p class="social-link">
									{rede.link ? rede.link : $t('divNoticias.semLink') || 'Sem link associado'}
								</p>
							</div>
							<i class="fas fa-eye"></i>
						</button>
					{/each}
				</div>
			</section>
		{/if}
	</div>


	<Modal
		title="{selectedSocialNetwork} - PrÃ©-visualizaÃ§Ã£o nas Redes Sociais"
		open={showPopup}
		onClosed={(data) => {
			onPopupClose(data);
		}}
	>
		{#if selectedSocialNetwork === 'Facebook'}
			<FacebookPreview {noticiaSelecionada} />
		{:else if selectedSocialNetwork === 'Twitter'}
			<TwitterPreview {noticiaSelecionada} />
		{:else if selectedSocialNetwork === 'Instagram'}
			<InstagramPreview {noticiaSelecionada} />
		{:else if selectedSocialNetwork === 'LinkedIn'}
			<LinkedinPreview {noticiaSelecionada} />	
		{:else if selectedSocialNetwork === 'Tiktok'}
			<TiktokPreview {noticiaSelecionada} />
		{/if}
	</Modal>
	<!-- Publish Modal -->
	<Modal
		title={$t('divNoticias.publicarNoticia')}
		open={showPublish}
		onClosed={(data) => onPopupClose(data)}
	>
		<PublicarNoticia {noticiaSelecionada} {redesSocial} />
	</Modal>

	<!-- Remove Modal -->
	<RemoveModal bind:this={removeModalBind} on:refreshData={onDeleteRow} />
{:else}
	<div id="loading_area">
		<div id="loading-on">
			<span class="dot-on">.</span>
			<span class="dot-on2">.</span>
			<span class="dot-on3">.</span>
		</div>
	</div>
{/if}



<style>
	@import "../../portal_noticias.css";

	.detail-shell {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1.5rem 1rem 2rem;
	}

	.detail-card {
		background: #fff;
		border: 1px solid #e6ecf5;
		border-radius: 16px;
		padding: 1.5rem;
		box-shadow: 0 10px 30px rgba(15, 37, 67, 0.06);
	}

	.detail-hero-card {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 2rem;
		background: linear-gradient(135deg, rgba(17, 100, 210, 0.12), rgba(255, 255, 255, 0.95));
		border: none;
	}

	.hero-text {
		max-width: 720px;
	}

	.hero-eyebrow {
		text-transform: uppercase;
		font-size: 0.75rem;
		letter-spacing: 0.14em;
		color: #4a6cb1;
		margin-bottom: 0.35rem;
	}

	.hero-title {
		font-size: clamp(1.8rem, 3vw, 2.4rem);
		color: #0c2540;
		margin-bottom: 0.6rem;
	}

	.hero-summary {
		color: #4a6075;
		margin-bottom: 0.9rem;
		line-height: 1.5;
	}

	.hero-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 0.6rem;
	}

	.chip {
		border-radius: 999px;
		padding: 0.35rem 0.95rem;
		font-weight: 600;
		font-size: 0.9rem;
	}

	.chip-status {
		background: rgba(0, 93, 255, 0.15);
		color: #005dff;
		text-transform: capitalize;
	}

	.chip-type {
		background: #e5edff;
		color: #0f3d91;
	}

	.hero-date {
		font-size: 0.95rem;
		color: #5b6f85;
	}

	.hero-meta {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 0.75rem;
		min-width: 260px;
	}

	.hero-meta-item {
		background: rgba(255, 255, 255, 0.8);
		border: 1px solid rgba(12, 37, 64, 0.05);
		border-radius: 12px;
		padding: 0.85rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.hero-meta-item span {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #6f7f91;
	}

	.hero-meta-item strong {
		color: #0c2540;
	}

	.stat-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 0.9rem;
	}

	.stat-card {
		background: #f3f6fb;
		border-radius: 14px;
		padding: 1rem 1.2rem;
		border: 1px solid rgba(12, 37, 64, 0.04);
	}

	.stat-label {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.09em;
		color: #6c7d90;
		margin: 0;
	}

	.stat-value {
		margin: 0.2rem 0 0;
		font-weight: 600;
		color: #0c2540;
	}

	.detail-content-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 1.25rem;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.card-header h4 {
		margin: 0;
		color: #0c2540;
		font-size: 1.05rem;
	}

	.narrative-body {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		color: #1f2b37;
		line-height: 1.7;
	}

	.narrative-body p {
		margin: 0;
	}

	.muted {
		color: #718095;
		font-size: 0.9rem;
	}

	.meta-list {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		margin: 0;
	}

	.meta-list dt {
		font-size: 0.78rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #8091a7;
		margin-bottom: 0.1rem;
	}

	.meta-list dd {
		margin: 0;
		font-weight: 600;
		color: #0c2540;
	}

	.media-duo {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 1rem;
	}

	.media-frame {
		border-radius: 14px;
		overflow: hidden;
		background: #0c2540;
	}

	.media-frame img,
	.media-frame video {
		width: 100%;
		display: block;
		object-fit: cover;
		max-height: 420px;
	}

	.media-controls {
		display: flex;
		gap: 0.35rem;
	}

	.ghost-btn {
		border: 1px solid rgba(12, 37, 64, 0.15);
		background: transparent;
		color: #0c2540;
		border-radius: 999px;
		width: 34px;
		height: 34px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.ghost-btn:disabled {
		opacity: 0.35;
		cursor: default;
	}

	.ghost-btn:not(:disabled):hover {
		border-color: #0d5bff;
		color: #0d5bff;
	}

	.attachments-card .attachment-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}

	.attachment-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding: 0.9rem 1rem;
		border: 1px solid #e6ecf5;
		border-radius: 12px;
	}

	.attachment-name {
		margin: 0;
		font-weight: 600;
	}

	.attachment-type {
		font-size: 0.85rem;
		color: #6e7d92;
	}

	.social-board .social-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.social-item {
		border: 1px solid #e0e6f2;
		border-radius: 12px;
		padding: 0.85rem 1rem;
		background: #f7f9fd;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		text-align: left;
		color: #0c2540;
		cursor: pointer;
		transition: border-color 0.2s ease;
	}

	.social-item:hover {
		border-color: #0d5bff;
	}

	.social-name {
		margin: 0;
		font-weight: 600;
	}

	.social-link {
		margin: 0;
		font-size: 0.85rem;
		color: #6c7d90;
		word-break: break-word;
	}

	@media (max-width: 992px) {
		.detail-hero-card {
			flex-direction: column;
		}
	}

	@media (max-width: 640px) {
		.detail-shell {
			padding: 1rem 0.75rem 1.5rem;
		}

		.stat-grid,
		.detail-content-grid,
		.media-duo {
			grid-template-columns: 1fr;
		}
	}
</style>
