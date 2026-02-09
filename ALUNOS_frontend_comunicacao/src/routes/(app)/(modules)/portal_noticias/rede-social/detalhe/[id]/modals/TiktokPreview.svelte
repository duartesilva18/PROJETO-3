<script>
	import { onMount } from 'svelte';
	import logo_IPVC from './logos/logo_IPVC.jpg';
	import tiktok from './logos/tiktok.png';

	

	/** @type {{noticiaSelecionada?: any}} */
	let { noticiaSelecionada = {} } = $props();

	let tagView = $state([]);
	let currentIndex = $state(0);
	let expanded = $state(false);

	// Expand/Collapse text
	const toggleExpanded = () => {
		expanded = !expanded;
	};

	onMount(async () => {
		tagView = await fetch('/ep/portal_noticias/tags').then((d) => d.json());
	});

	/** 
	 * Check if an anexo is for TikTok.
	 */
	function isForTikTok(anexo) {
		return anexo.code_rede_social && anexo.code_rede_social.charAt(4) === '1';
	}

	/**
	 * Return ONLY TikTok images.
	 * We'll call this whenever we need the array of relevant images.
	 */
	function getTikTokImages() {
		if (!noticiaSelecionada.pn_anexos) {
			return [];
		}

		return noticiaSelecionada.pn_anexos.filter(
			(anexo) => anexo.tipo?.startsWith('image/') && isForTikTok(anexo)
		);
	}

	function getTikTokVideos() {
		if (!noticiaSelecionada.pn_anexos) {
			return [];
		}
		return noticiaSelecionada.pn_anexos.filter(
			(anexo) => anexo.tipo?.startsWith('video/') && isForTikTok(anexo)
		);
	}

	/**
	 * Move to the next image in the TikTok images array.
	 */
	function nextImage() {
		const images = getTikTokImages();
		if (currentIndex < images.length - 1) {
			currentIndex++;
		}
	}

	/**
	 * Move to the previous image in the TikTok images array.
	 */
	function previousImage() {
		if (currentIndex > 0) {
			currentIndex--;
		}
	}

	console.log('TikTok images:', getTikTokImages());

</script>

<div class="container">
    <div class="header">
        <h1>TikTok</h1>
    </div>

    <div class="perfil">
        <img src={logo_IPVC} alt="Perfil da publicação" class="perfil-img" />
        <div class="perfil-info">
            <span class="perfil-username">IPVC</span>
        </div>
    </div>

    <div class="content">
        <div class="main-content">

            <!-- IMAGES SECTION -->
            {#if getTikTokImages().length > 0}
                <div class="post">
                    <p class:expanded>
                        <!-- Show text_tiktok, truncated if longer than 200 chars -->
                        {#if noticiaSelecionada.texto_tiktok && noticiaSelecionada.texto_tiktok.length > 200}
                            {noticiaSelecionada.texto_tiktok.substring(0, 200)}
                            <span class="more-text">
                                {noticiaSelecionada.texto_tiktok.substring(200)}
                            </span>
                            {#each tagView as tv (tv.id_tag)}
                                {#each noticiaSelecionada.pn_noticia_Tag as tag}
                                    {#if tag.id_tag === tv.id_tag}
                                        <span>#{tv.nome} </span>
                                    {/if}
                                {/each}
                            {/each}
                            <span class="more-link" on:click={toggleExpanded}>
                                {expanded ? 'Ver menos' : '...Ver mais'}
                            </span>
                        {:else}
                            {noticiaSelecionada.texto_tiktok}
                            {#each tagView as tv (tv.id_tag)}
                                {#each noticiaSelecionada.pn_noticia_Tag as tag}
                                    {#if tag.id_tag === tv.id_tag}
                                        <span>#{tv.nome} </span>
                                    {/if}
                                {/each}
                            {/each}
                        {/if}
                    </p>

                    <!-- Navigation Arrows -->
                    <div class="image-menu">
                        <button on:click={previousImage} disabled={currentIndex === 0}>❮</button>
                        <button
                            on:click={nextImage}
                            disabled={currentIndex === getTikTokImages().length - 1}
                        >
                            ❯
                        </button>
                    </div>

                    <!-- Content Wrapper: Image + TikTok Icon -->
					<div class="content-wrapper">
						<!-- Show current TikTok image -->
						<img
							class="imagem_img"
							src={`/ep/portal_noticias/getFileById?id=${getTikTokImages()[currentIndex].id_anexo}`}
							alt={getTikTokImages()[currentIndex].nome_ficheiro}
						/>

						<!-- TikTok Icon on the right -->
						<div class="icon-container">
							<img src={tiktok} alt="TikTok Icon" class="icons-image" />
						</div>
					</div>
                </div>
            {/if}

            <!-- VIDEOS SECTION -->
			{#if getTikTokVideos().length > 0}
			<h2 class="videos-title">Video:</h2>
			{#each getTikTokVideos() as video}
				<div class="post">
					<div class="content-wrapper">
						<!-- Video Player -->
						<video
							class="video_player"
							controls
							src={`/ep/portal_noticias/getFileById?id=${video.id_anexo}`}
						>
							Your browser does not support the video tag.
						</video>

						<!-- Vertical TikTok Icon Bar -->
						<div class="icon-container">
							<img src={tiktok} alt="TikTok Icon" class="icons-image" />
						</div>
					</div>

					<!-- Text / hashtags -->
					<p>
						{noticiaSelecionada.texto_tiktok}
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



            <!-- COMBINED FALLBACK -->
            {#if getTikTokImages().length === 0 && getTikTokVideos().length === 0}
                <div class="post">
                    <p class:expanded>
                        {#if noticiaSelecionada.texto_tiktok && noticiaSelecionada.texto_tiktok.length > 200}
                            {noticiaSelecionada.texto_tiktok.substring(0, 200)}
                            <span class="more-text">
                                {noticiaSelecionada.texto_tiktok.substring(200)}
                            </span>
                            {#each tagView as tv (tv.id_tag)}
                                {#each noticiaSelecionada.pn_noticia_Tag as tag}
                                    {#if tag.id_tag === tv.id_tag}
                                        <span>#{tv.nome} </span>
                                    {/if}
                                {/each}
                            {/each}
                            <span class="more-link" on:click={toggleExpanded}>
                                {expanded ? 'Ver menos' : '...Ver mais'}
                            </span>
                        {:else}
                            {noticiaSelecionada.texto_tiktok}
                            {#each tagView as tv (tv.id_tag)}
                                {#each noticiaSelecionada.pn_noticia_Tag as tag}
                                    {#if tag.id_tag === tv.id_tag}
                                        <span>#{tv.nome} </span>
                                    {/if}
                                {/each}
                            {/each}
                        {/if}
                    </p>
                    <img
                        class="imagem_img"
                        src="https://via.placeholder.com/600x600"
                        alt="No Tiktok images"
                    />
                </div>
            {/if}

        </div>
    </div>
</div>


<style>
	.more-text {
		display: none;
	}
	.expanded .more-text {
		display: inline;
	}
	.more-link {
		color: #000000;
		cursor: pointer;
	}
	.content-wrapper {
		display: flex; /* Arrange content horizontally */
		align-items: center; /* Align items vertically */
		justify-content: flex-start; /* Keep the content aligned to the left */
		position: relative;
	}
	.video_player {
		width: 300px;
		height: auto;
		border-radius: 8px;
		margin: 20px auto;
		display: block;
		object-fit: cover;
	}
	.imagem_img {
		width: 300px;
		height: auto;
		border-radius: 8px;
		margin: 20px auto;
		display: block;
		object-fit: cover;
	}
	.icon-container {
		position: absolute; /* Position the icons relative to the image */
		top: 50%; /* Center vertically on the image */
		right: -16px; /* Move the icons slightly to the right */
		transform: translateY(-50%); /* Adjust for vertical centering */
	}
	.icons-image {
		width: 28px; /* Adjust the size of the icons */
		height: auto;
		object-fit: contain; /* Maintain aspect ratio */
	}
	.image-menu {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: 10px;
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
	.branding img {
		max-width: 300px;
		height: auto;
		margin-top: 10px;
	}
	.container {
		max-width: 400px;
		margin: 0 auto;
		padding: 20px;
	}
	.header {
		background-color: #010101;
		color: #fff;
		padding: 10px 20px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.header h1 {
		font-size: 24px;
		margin: 0;
	}
	.main-content {
		background-color: #fff;
		margin-top: 20px;
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
	.perfil-info {
		display: flex;
		flex-direction: column;
	}
	.perfil-username {
		font-weight: bold;
		font-size: 16px;
	}
	.image-container img {
		max-width: 100%;
		height: auto;
	}
	.video_player {
		max-width: 100%;
		display: block;
		margin: 20px auto;
		border-radius: 8px;
	}
	.videos-title {
    font-size: 20px;
    font-weight: bold;
    color: #69C9D0; /* Use the same blue as the Facebook header bar */
    margin: 20px 0 10px; /* Some vertical spacing if desired */
  	}
</style>
