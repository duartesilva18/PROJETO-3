<script>
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

	
	

	// titulo da página


	// Extraia o id da notícia dos parâmetros da rota
const translate = (key) => $t(key);
configurePortalSidebar('dashboard', translate);

const noticiaId = $page.params.id;
	
	let currentIndex = $state(0);
	let noticiaSelecionada = $state();
	let redesSocial = $state([]);
	let pedidos = $state([]);
	let radios_jornais = $state([]);
	let pedidoassunto = $state('');
	let selectedSocialNetwork = $state('bacx');
	let resultString = $state('');
	let showPopup = $state(false);
	let showPublish= $state(false);

	let removeModalBind = $state();
	console.log("1");
	
	console.log("2");

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
			redesSocial = await fetch('/ep/portal_noticias/redes').then(d => d.json());
			noticiaSelecionada = await await fetch(`/ep/portal_noticias/noticia?id=${noticiaId}`).then(d => d.json());
			pedidos = await fetch('/ep/portal_noticias/getJson').then(d => d.json());
			radios_jornais = await fetch('/ep/portal_noticias/radio_jornal').then(d => d.json())
	       
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
			console.error('Erro ao buscar notícia:', error);
		}
	});

	

	async function publicarNoticia() {
		console.log("publicar noticia clicado!")
		handleSelect(noticiaSelecionada);
		console.log("Show Publish State After handleSelect:", showPublish);
	}

	function nextImage() {
		if (currentIndex < noticiaSelecionada.pn_anexos.length - 1) {
			currentIndex++;
		}
	}

	function previousImage() {
		if (currentIndex > 0) {
			currentIndex--;
		}
	}
	
	let auxdois = 0;
	let currentVideoIndex = 0;
	let index = $state(0);
	let videoElement; // Referência ao elemento de vídeo

	// Função para obter os vídeos filtrados
	function getVideos() {
		return noticiaSelecionada?.pn_anexos?.filter(anexo => anexo.tipo.startsWith('video/')) || [];
	}

	function nextVideo() {
		const videos = getVideos();
		if (index < videos.length - 1) {
			index += 1;
			updateVideo(); // Atualiza o vídeo
		}
	}

	function prevVideo() {
		if (index > 0) {
			index -= 1;
			updateVideo(); // Atualiza o vídeo
		}
	}

	// Força o carregamento do vídeo novo
	function updateVideo() {
    	if (videoElement) {
			const videos = getVideos();
			videoElement.src = `/ep/portal_noticias/getFileById?id=${videos[index].id_anexo}`;
			videoElement.type = videos[index].tipo;
			videoElement.load(); // Força o navegador a recarregar o vídeo
		}
	}	

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
	function getNomeRedeSocialById(id) {
		// Certifique-se de que o tipo de 'id' corresponde ao tipo de 'rede.id_rede_social'
		const rede = redesSocial.find((rede) => rede.id_rede_social === id);
		if (rede) {
			return rede;
		} else {
			console.error('Rede social não encontrada para o ID:', id);
			return null; // Ou maneje o erro conforme necessário
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
			console.error('RemoveModal não está disponível');
			alert('Erro: RemoveModal não está disponível. Por favor, recarregue a página.');
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
		},
		{
			icon_class: 'fas fa-plus',
			url: '#',
			designacao: $t('divPublicar.cria'),
			function: createNoticia
		},
		{
			icon_class: 'fas fa-edit',
			url: '#',
			designacao: $t('divNoticias.editar'),
			function: editNoticia
		},
		{
			icon_class: 'fas fa-trash',
			url: '#',
			designacao: $t('divNoticias.excluir'),
			function: deleteNoticia
		}
	]);
</script>

{#if noticiaSelecionada}
	<!-- Verifica se noticia não está vazio -->
	<Breadcrum modulo={1} objeto={1} menu_items={items_breadcrum} />

	<div class="noticia-page">
		<section class="noticia-card noticia-card--hero">
			<div class="noticia-header">
				<div>
					<p class="label-pill">{$t('divNoticias.noticia')}</p>
					<h1 class="titulo">{noticiaSelecionada.titulo}</h1>
					<p class="data">
						{$t('divNoticias.dataCriacao')}: {formatDate(noticiaSelecionada.data_criacao)}
					</p>
				</div>
				<span class="estado estado-chip {noticiaSelecionada.estado}">
					{noticiaSelecionada.tipo === 1 && noticiaSelecionada.estado === 'Pendente'
						? 'Rascunho'
						: noticiaSelecionada.estado}
				</span>
			</div>

			<div class="row g-3 noticia-meta">
				<div class="col-md-4">
					<div class="meta-card">
						<p class="meta-label">{$t('divNoticias.categoria')}</p>
						<p class="meta-value">{noticiaSelecionada.pn_categoria.nome}</p>
					</div>
				</div>
				<div class="col-md-4">
					<div class="meta-card">
						<p class="meta-label">{$t('divNoticias.Pedido')}</p>
						<p class="meta-value">{pedidoassunto}</p>
					</div>
				</div>
				{#if noticiaSelecionada.tipo === 1}
					<div class="col-md-4">
						<div class="meta-card">
							<p class="meta-label">{$t('divNoticias.Radio_Jornal')}</p>
							<p class="meta-value">{resultString}</p>
						</div>
					</div>
				{/if}
			</div>
		</section>

		<section class="noticia-card noticia-card--body">
			<h4 class="section-title">{$t('divNoticias.Texto')}</h4>
			<div class="texto-wrapper">
				{#each noticiaSelecionada.texto.split('\n') as paragrafo, index (index)}
					<p class="texto">{paragrafo}</p>
				{/each}
			</div>
		</section>

		<section class="media-grid">
			{#if noticiaSelecionada.pn_anexos.some((anexo) => anexo.tipo.startsWith('image/'))}
				<div class="noticia-card media-card">
					<div class="media-card__header">
						<h4 class="section-title">Galeria de imagens</h4>
						<p class="media-counter">
							Imagem {currentIndex + 1} de {noticiaSelecionada.pn_anexos.filter((anexo) =>
								anexo.tipo.startsWith('image/')
							).length}
						</p>
					</div>
					<div class="imagem">
						<img
							src={`/ep/portal_noticias/getFileById?id=${
								noticiaSelecionada.pn_anexos.filter((anexo) => anexo.tipo.startsWith('image/'))[
									currentIndex
								].id_anexo
							}`}
							alt={
								noticiaSelecionada.pn_anexos.filter((anexo) => anexo.tipo.startsWith('image/'))[currentIndex]
									.nome
							}
						/>
					</div>
					<div class="nav-buttons">
						<button onclick={previousImage} disabled={currentIndex === 0} class="btn btn-light btn-sm">
							<i class="fas fa-chevron-left"></i>
							{$t('divNoticias.anterior') || 'Anterior'}
						</button>
						<button
							onclick={nextImage}
							disabled={
								currentIndex ===
								noticiaSelecionada.pn_anexos.filter((anexo) => anexo.tipo.startsWith('image/')).length - 1
							}
							class="btn btn-light btn-sm"
						>
							{$t('divNoticias.seguinte') || 'Seguinte'}
							<i class="fas fa-chevron-right"></i>
						</button>
					</div>
				</div>
			{/if}

			{#if noticiaSelecionada.pn_anexos.some((anexo) => anexo.tipo.startsWith('video/'))}
				<div class="noticia-card media-card">
					<div class="media-card__header">
						<h4 class="section-title">Vídeos</h4>
						<p class="media-counter">Vídeo {index + 1} de {getVideos().length}</p>
					</div>
					<div class="videos">
						<video controls bind:this={videoElement}>
							<source
								src={`/ep/portal_noticias/getFileById?id=${getVideos()[index].id_anexo}`}
								type={getVideos()[index].tipo}
							/>
							O navegador não suporta a tag de vídeo.
						</video>
					</div>
					<div class="nav-buttons">
						<button onclick={prevVideo} disabled={index === 0} class="btn btn-light btn-sm">
							<i class="fas fa-chevron-left"></i>
							{$t('divNoticias.anterior') || 'Anterior'}
						</button>
						<button onclick={nextVideo} disabled={index === getVideos().length - 1} class="btn btn-light btn-sm">
							{$t('divNoticias.seguinte') || 'Seguinte'}
							<i class="fas fa-chevron-right"></i>
						</button>
					</div>
				</div>
			{/if}
		</section>

		{#if noticiaSelecionada.pn_rs_noticia && noticiaSelecionada.pn_rs_noticia.length > 0}
			<section class="noticia-card">
				<p class="section-title mb-3">
					Pré-visualizar publicação nas Redes Sociais
				</p>
				<div class="redes-sociais gap-3">
					{#each noticiaSelecionada.pn_rs_noticia as rede}
						<div class="rede-social d-flex align-items-center">
							<a
								href={rede.link}
								target="_blank"
								onclick={() => handleClick(getNomeRedeSocialById(rede.id_rede_social_FK))}
								style={getSocialButtonStyle(getNomeRedeSocialById(rede.id_rede_social_FK).nome)}
								class="rede-button"
							>
								<i
									class={getNomeRedeSocialById(rede.id_rede_social_FK).icone}
									style="font-size: 1.5em; margin-right: 8px;"
								></i>
								{getNomeRedeSocialById(rede.id_rede_social_FK).nome}
							</a>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		{#if noticiaSelecionada.estado === 'Pendente'}
			<div class="share-card noticia-card">
				<div>
					<h4 class="section-title mb-2">{$t('divNoticias.readyPublish') || 'Pronto para publicação?'}</h4>
					<p class="share-hint mb-3">
						{$t('divNoticias.readyPublishHint') || 'Revê o conteúdo acima e publica quando estiver tudo finalizado.'}
					</p>
					<button
						onclick={publicarNoticia}
						class="btn btn-success btn-lg px-4"
						style="background-color: #28a745;"
					>
						<i class="fas fa-share-alt me-2" style="font-size: 1.1em;"></i>
						{$t('divNoticias.publish_message')}
					</button>
				</div>
			</div>
		{/if}
	</div>

	<Modal
		title="{selectedSocialNetwork} - Pré-visualização nas Redes Sociais"
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
	.noticia-page {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1rem;
	}

	.noticia-card {
		background-color: #fff;
		border: 1px solid #e6e9ed;
		border-radius: 8px;
		padding: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
	}

	.noticia-card--hero {
		border: none;
		background: linear-gradient(135deg, rgba(88, 147, 255, 0.12), rgba(255, 255, 255, 0.9));
		box-shadow: none;
	}

	.noticia-card--body {
		padding: 2rem;
	}

	.noticia-header {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: flex-start;
		flex-wrap: wrap;
	}

	.estado-chip {
		padding: 0.35rem 0.9rem;
		border-radius: 999px;
		font-weight: 600;
		font-size: 0.95rem;
		text-transform: capitalize;
	}

	.label-pill {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #6c757d;
		margin-bottom: 0.5rem;
	}

	.titulo {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 0.6rem;
	}

	.data {
		font-size: 0.95rem;
		color: #6c757d;
		margin-bottom: 0;
	}

	.noticia-meta {
		margin-top: 1rem;
	}

	.noticia-meta .meta-card {
		background-color: #f8f9fa;
		border-radius: 8px;
		padding: 1rem 1.2rem;
		height: 100%;
		box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.02);
	}

	.meta-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		color: #6c757d;
		margin-bottom: 0.15rem;
		letter-spacing: 0.08em;
	}

	.meta-value {
		font-size: 1.05rem;
		font-weight: 600;
		color: #212529;
		margin: 0;
		word-break: break-word;
	}

	.section-title {
		font-size: 1.1rem;
		font-weight: 600;
		color: #212529;
		margin-bottom: 0.75rem;
	}

	.texto-wrapper {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		background-color: #fdfdfd;
		border-radius: 8px;
		box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.02);
	}

	.texto {
		font-size: 1rem;
		line-height: 1.7;
		color: #2f2f2f;
		margin: 0;
	}

	.media-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 1.25rem;
	}

	.media-card__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.media-counter {
		font-size: 0.9rem;
		color: #6c757d;
		margin: 0;
	}

	.imagem img,
	.videos video {
		width: 100%;
		border-radius: 10px;
		object-fit: cover;
		max-height: 480px;
	}

	.imagem {
		display: flex;
		justify-content: center;
	}

	.imagem img {
		max-width: 900px;
	}

	.nav-buttons {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		margin-top: 1rem;
	}

	.nav-buttons .btn {
		flex: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
	}

	.redes-sociais {
		display: flex;
		flex-wrap: wrap;
		padding: 0.75rem;
		background-color: #f8f9fa;
		border-radius: 8px;
		gap: 0.5rem;
	}

	.rede-social {
		display: flex;
		align-items: center;
	}

	.rede-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.6rem 1.1rem;
		font-weight: 600;
		text-decoration: none;
		border-radius: 999px;
		font-size: 0.95rem;
		background-color: #fff;
		box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.rede-button:hover {
		transform: translateY(-1px);
		box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
		text-decoration: none;
	}

	.share-card {
		padding: 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1.5rem;
		background: linear-gradient(135deg, rgba(40, 167, 69, 0.12), rgba(255, 255, 255, 0.9));
	}

	.share-hint {
		font-size: 0.95rem;
		color: #495057;
	}

	@media (max-width: 992px) {
		.share-card {
			flex-direction: column;
			align-items: flex-start;
		}
	}

	@media (max-width: 768px) {
		.noticia-page {
			padding: 0.75rem;
		}

		.noticia-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.media-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
