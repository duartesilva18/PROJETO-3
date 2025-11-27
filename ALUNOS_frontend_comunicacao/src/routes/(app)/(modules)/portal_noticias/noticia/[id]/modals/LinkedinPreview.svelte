<script>
	import { onMount } from 'svelte';
	import logo_IPVC from './logos/logo_IPVC.jpg';
	import linkedinLogo from './logos/linkedin.png';

	/** @type {{noticiaSelecionada?: any}} */
	let { noticiaSelecionada = {} } = $props();

	let tagView = $state([]);
	let currentIndex = $state(0);
	let expanded = $state(false);

	onMount(async () => {
		tagView = await fetch('/ep/portal_noticias/tags').then(d => d.json());
	});

	/**
	 * Check if an anexo is for LinkedIn.
	 * LinkedIn is represented by charAt(3) === '1'
	 */
	function isForLinkedin(anexo) {
		return anexo.code_rede_social && anexo.code_rede_social.charAt(3) === '1';
	}

	/** Return ONLY LinkedIn images. */
	function getLinkedinImages() {
		if (!noticiaSelecionada.pn_anexos) return [];
		return noticiaSelecionada.pn_anexos.filter(
			(anexo) => anexo.tipo?.startsWith('image/') && isForLinkedin(anexo)
		);
	}

	/** Return ONLY LinkedIn videos. */
	function getLinkedinVideos() {
		if (!noticiaSelecionada.pn_anexos) return [];
		return noticiaSelecionada.pn_anexos.filter(
			(anexo) => anexo.tipo?.startsWith('video/') && isForLinkedin(anexo)
		);
	}

	/** Move to the next image */
	function nextImage() {
		if (currentIndex < getLinkedinImages().length - 1) {
			currentIndex++;
		}
	}

	/** Move to the previous image */
	function previousImage() {
		if (currentIndex > 0) {
			currentIndex--;
		}
	}
</script>

<!-- CONTAINER -->
<div class="container">
	<!-- HEADER -->
	<div class="header">
		<h1>LinkedIn</h1>
	</div>

	<!-- PROFILE (User Info) -->
	<div class="perfil">
		<img src={logo_IPVC} alt="Perfil da publicação" class="perfil-img" />
		<div class="perfil-info">
			<span class="perfil-username">IPVC</span>
		</div>
	</div>

	<!-- CONTENT WRAPPER -->
	<div class="content">
		<div class="main-content">

			<!-- IMAGES BLOCK -->
			{#if getLinkedinImages().length > 0}
				<div class="post">
					{#if getLinkedinImages().length > 1}
						<div class="image-menu">
							<button on:click={previousImage} disabled={currentIndex === 0}>❮</button>
							<button on:click={nextImage} disabled={currentIndex === getLinkedinImages().length - 1}>❯</button>
						</div>
					{/if}

					<!-- Display the current LinkedIn image -->
					<img
						class="imagem_img"
						src={`/ep/portal_noticias/getFileById?id=${getLinkedinImages()[currentIndex].id_anexo}`}
						alt={getLinkedinImages()[currentIndex].nome}
					/>

					<!-- LinkedIn Branding/Icon -->
					<div class="branding">
						<img  src={linkedinLogo}  alt="LinkedIn branding" style="width: 100%; max-width: 400px; display: block; margin: auto;"/>
					</div>

					<!-- Text / Hashtags -->
					<p>
						{noticiaSelecionada.texto_linkedin}
						{#each tagView as tv (tv.id_tag)}
							{#each noticiaSelecionada.pn_noticia_Tag as tag}
								{#if tag.id_tag === tv.id_tag}
									<span>#{tv.nome} </span>
								{/if}
							{/each}
						{/each}
					</p>
				</div>
			{/if}
			<!-- END IMAGES BLOCK -->

			<!-- VIDEOS BLOCK -->
			{#if getLinkedinVideos().length > 0}
			<h2 class="videos-title">Video:</h2>
			{#each getLinkedinVideos() as video}
				<div class="post">
					<!-- Video Player -->
					<video class="video_player" controls src={`/ep/portal_noticias/getFileById?id=${video.id_anexo}`}>
						Your browser does not support the video tag.
					</video>

					<!-- Branding/Icon -->
					<div class="branding">
						<img src={linkedinLogo} alt="LinkedIn branding" style="width: 100%; max-width: 400px; display: block; margin: auto;"/>					
					</div>

					<!-- Text / Hashtags -->
					<p>
						{noticiaSelecionada.texto_linkedin}
						{#each tagView as tv (tv.id_tag)}
							{#each noticiaSelecionada.pn_noticia_Tag as tag}
								{#if tag.id_tag === tv.id_tag}
									<span>#{tv.nome} </span>
								{/if}
							{/each}
						{/each}
					</p>
				</div>
			{/each}
			{/if}
			<!-- END VIDEOS BLOCK -->

			<!-- FALLBACK (No Images + No Videos) -->
			{#if getLinkedinImages().length === 0 && getLinkedinVideos().length === 0}
				<div class="alert alert-danger">
					<i class="fas fa-exclamation-triangle"></i>
					Noticias sem imagens/vídeos anexados não poderão ser publicadas no LinkedIn.
				</div>
				<div class="post">
					<img src="https://via.placeholder.com/600x600" alt="Placeholder" />
					<div class="branding">
						<img src={linkedinLogo} alt="LinkedIn branding" style="width: 100%; max-width: 400px; display: block; margin: auto;"/>					
					</div>
					<p>
						{noticiaSelecionada.texto_linkedin}
						{#each tagView as tv (tv.id_tag)}
							{#each noticiaSelecionada.pn_noticia_Tag as tag}
								{#if tag.id_tag === tv.id_tag}
									<span>#{tv.nome} </span>
								{/if}
							{/each}
						{/each}
					</p>
				</div>
			{/if}
			<!-- END FALLBACK -->

		</div>
	</div>
</div>

<style>
	

	.container {
		max-width: 400px;
		margin: 0 auto;
		padding: 20px;
		font-family: Arial, sans-serif;
	}

	.header h1 {
		color: #0077B5;
		font-size: 24px;
		margin: 0;
	}

	.perfil-img {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		margin-right: 10px;
	}

	.imagem_img {
		width: 300px;
		height: 300px;
		object-fit: cover;
		border-radius: 5px;
		display: block;
		margin: 0 auto;
	}

	.video_player {
		width: 100%;
		border-radius: 5px;
	}

	.branding {
		text-align: center;
		margin-top: 10px;
	}

	.branding img {
		max-width: 100px;
	}
</style>