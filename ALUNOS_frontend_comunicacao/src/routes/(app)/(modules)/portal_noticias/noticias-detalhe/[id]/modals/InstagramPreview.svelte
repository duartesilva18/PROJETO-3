<script>
	import { onMount } from 'svelte';
	import logo_IPVC from './logos/logo_IPVC.jpg';
	import teste from './logos/instagram.png';

	/** @type {{noticiaSelecionada?: any}} */
	let { noticiaSelecionada = {} } = $props();

	let tagView = $state([]);
	let currentIndex = $state(0);
	let expanded = $state(false);

	onMount(async () => {
		tagView = await fetch('/ep/portal_noticias/tags').then(d => d.json());
	});

	/**
	 * Check if an anexo is for Instagram.
	 * Because Instagram = charAt(0) === '1'.
	 */
	function isForInstagram(anexo) {
		return anexo.code_rede_social && anexo.code_rede_social.charAt(0) === '1';
	}

	/**
	 * Return ONLY Instagram images.
	 */
	function getInstagramImages() {
		if (!noticiaSelecionada.pn_anexos) {
			return [];
		}
		return noticiaSelecionada.pn_anexos.filter(
			(anexo) => anexo.tipo?.startsWith('image/') && isForInstagram(anexo)
		);
	}

	function getInstagramVideos() {
		if (!noticiaSelecionada.pn_anexos) {
			return [];
		}

		return noticiaSelecionada.pn_anexos.filter(
			(anexo) => anexo.tipo?.startsWith('video/') && isForInstagram(anexo)
		);
	}


	/**
	 * Move to the next image in the Instagram images array.
	 */
	function nextImage() {
		const images = getInstagramImages();
		if (currentIndex < images.length - 1) {
			currentIndex++;
		}
	}

	/**
	 * Move to the previous image in the Instagram images array.
	 */
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
		<h1>Instagram</h1>
	</div>

	<!-- PERFIL (User Info) -->
	<div class="perfil">
		<img src={logo_IPVC} alt="Perfil da publicação" class="perfil-img" />
		<div class="perfil-info">
			<span class="perfil-username">IPVC</span>
		</div>
	</div>

	<!-- CONTENT WRAPPER -->
	<div class="content">
		<div class="main-content">

			<!-- IMAGES BLOCK (only if there are Instagram images) -->
			{#if getInstagramImages().length > 0}
				<div class="post">
					<!-- NAVIGATION ARROWS (❮ ❯) -->
					{#if getInstagramImages().length > 1}
						<div class="image-menu">
							<button on:click={previousImage} disabled={currentIndex === 0}>❮</button>
							<button
								on:click={nextImage}
								disabled={currentIndex === getInstagramImages().length - 1}
							>
								❯
							</button>
						</div>
					{/if}

					<!-- Show the current Instagram image -->
					<img
						class="imagem_img"
						src={`/ep/portal_noticias/getFileById?id=${getInstagramImages()[currentIndex].id_anexo}`}
						alt={getInstagramImages()[currentIndex].nome}
					/>

					<!-- Instagram branding/icon -->
					<div class="branding">
						<img src={teste} alt="Instagram branding" />
					</div>

					<!-- Text / hashtags -->
					<p>
						{noticiaSelecionada.texto_instagram}
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
			{#if getInstagramVideos().length > 0}
			<h2 class="videos-title">Video:</h2>
			{#each getInstagramVideos() as video}
				<div class="post">
					<!-- Show the video player -->
					<video
						class="video_player"
						controls
						src={`/ep/portal_noticias/getFileById?id=${video.id_anexo}`}
					>
						Your browser does not support the video tag.
					</video>

					<!-- Branding/Icon Section -->
					<div class="branding">
						<img src={teste} alt="Instagram branding" />
					</div>

					<!-- Text / hashtags -->
					<p>
						{noticiaSelecionada.texto_instagram}
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

			<!-- FALLBACK (no images + no videos) -->
			{#if getInstagramImages().length === 0 && getInstagramVideos().length === 0}
				<div class="alert alert-danger" role="alert">
					<i class="fas fa-exclamation-triangle"></i>
					Noticias sem imagens/vídeos anexados não poderão ser publicadas na rede social Instagram
				</div>
				<div class="post">
					<!-- Fallback placeholder -->
					<img src="https://via.placeholder.com/600x600" alt="Placeholder" />
					<div class="branding">
						<img src={teste} alt="Instagram branding" />
					</div>
					<p>
						{noticiaSelecionada.texto_instagram}
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
	/* Container similar to Facebook, just change the color scheme if you like. */
	.container {
		max-width: 400px; /* narrower so it looks like a phone screen preview */
		margin: 0 auto;
		padding: 20px;
		font-family: Arial, sans-serif;
	}

	.header {
		background-color: transparent; /* Instagram's pinkish color */
		color: #fff;
		padding: 10px 20px;
		display: flex;
		align-items: center;
		border-radius: 6px;
		justify-content: space-between;
	}

	.header h1 {
		color: #E1306C;
		font-size: 24px;
		margin: 0;
	}

	.perfil {
		display: flex;
		align-items: center;
		padding: 10px;
	}

	.perfil-img {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		margin-right: 10px;
	}

	.perfil-username {
		font-weight: bold;
		font-size: 16px;
	}

	.content {
		background-color: #fff;
		margin-top: 20px;
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.main-content {
		/* holds the main feed content */
	}

	.post {
		border: 1px solid #dbdbdb;
		border-radius: 3px;
		background-color: #fff;
		margin-bottom: 20px;
		padding: 10px;
	}

	.image-menu {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: 10px; /* spacing under arrows */
	}

	.image-menu button {
		background: none;
		border: none;
		font-size: 2em;
		cursor: pointer;
		color: #333;
		padding: 0 10px;
	}

	.image-menu button:disabled {
		color: #bbb;
		cursor: not-allowed;
	}

	.imagem_img {
		display: block;
		width: 300px;
		height: 300px;
		margin: 0 auto;
		object-fit: cover; /* keep aspect ratio */
		border-radius: 5px;
	}

	.branding {
		text-align: center;
		margin-top: 10px;
	}

	.branding img {
		max-width: 300px;
		height: auto;
	}

	.video_player {
		max-width: 100%;
		height: auto;
		display: block;
		margin: 0 auto;
	}

	.icon-container {
    margin-left: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.icons-image {
    width: 50px; /* Adjust size for the Instagram icon */
    object-fit: contain;
}

	.videos-title {
		font-size: 20px;
		font-weight: bold;
		color: #E1306C; /* Use the Instagram color */
		margin: 20px 0 10px;
	}

	.alert-danger {
		color: #721c24;
		background-color: #f8d7da;
		border-color: #f5c6cb;
		padding: 10px;
		margin-bottom: 10px;
		border-radius: 5px;
	}
</style>
