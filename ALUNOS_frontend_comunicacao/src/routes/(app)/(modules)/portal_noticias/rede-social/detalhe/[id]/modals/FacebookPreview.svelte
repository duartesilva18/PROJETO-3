<script>
	import { onMount } from 'svelte';
	import logo_IPVC from './logos/logo_IPVC.jpg';
	import face from './logos/facebook.png';
  
	let { noticiaSelecionada = {} } = $props();
	let tagView = $state([]);
	let currentIndex = $state(0);
	let expanded = $state(false);
  
	const toggleExpanded = () => {
	  expanded = !expanded;
	};
  
	onMount(async () => {
	  tagView = await fetch('/ep/portal_noticias/tags').then((d) => d.json());
	});
  
	function isForFacebook(anexo) {
	  return anexo.code_rede_social && anexo.code_rede_social.charAt(1) === '1';
	}
  
	function getFacebookImages() {
	  if (!noticiaSelecionada.pn_anexos) return [];
	  return noticiaSelecionada.pn_anexos.filter(
		(anexo) => anexo.tipo?.startsWith('image/') && isForFacebook(anexo)
	  );
	}
  
	function getFacebookVideos() {
	  if (!noticiaSelecionada.pn_anexos) return [];
	  return noticiaSelecionada.pn_anexos.filter(
		(anexo) => anexo.tipo?.startsWith('video/') && isForFacebook(anexo)
	  );
	}
  
	function nextImage() {
	  const images = getFacebookImages();
	  if (currentIndex < images.length - 1) {
		currentIndex++;
	  }
	}
  
	function previousImage() {
	  if (currentIndex > 0) {
		currentIndex--;
	  }
	}
  </script>
  
  <div class="container">
	<!-- HEADER -->
	<div class="header">
	  <h1>Facebook</h1>
	</div>
  
	<!-- PERFIL -->
	<div class="perfil">
	  <img src={logo_IPVC} alt="Perfil da publicação" class="perfil-img" />
	  <div class="perfil-info">
		<span class="perfil-username">IPVC</span>
	  </div>
	</div>
  
		<!-- MAIN CONTENT -->
		<div class="content">
		<div class="main-content">
			<!-- If multiple images, show Prev/Next navigation -->
			{#if getFacebookImages().length > 1}
			<div class="image-menu">
				<button on:click={previousImage} disabled={currentIndex === 0}>❮</button>
				<button
				on:click={nextImage}
				disabled={currentIndex === getFacebookImages().length - 1}
				>
				❯
				</button>
			</div>
		{/if}
  
		<!-- IMAGES BLOCK (only if we have Facebook images) -->
		{#if getFacebookImages().length > 0}
		  <div class="post">
			<p class:expanded>
			  <!-- Show text_facebook, truncated if longer than 200 chars -->
			  {#if noticiaSelecionada.texto_facebook && noticiaSelecionada.texto_facebook.length > 200}
				{noticiaSelecionada.texto_facebook.substring(0, 200)}
				<span class="more-text">
				  {noticiaSelecionada.texto_facebook.substring(200)}
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
				{noticiaSelecionada.texto_facebook}
				{#each tagView as tv (tv.id_tag)}
				  {#each noticiaSelecionada.pn_noticia_Tag as tag}
					{#if tag.id_tag === tv.id_tag}
					  <span>#{tv.nome} </span>
					{/if}
				  {/each}
				{/each}
			  {/if}
			</p>
  
			<!-- Show the current Facebook image -->
			<img
			  class="imagem_img"
			  src={`/ep/portal_noticias/getFileById?id=${getFacebookImages()[currentIndex].id_anexo}`}
			  alt={getFacebookImages()[currentIndex].nome_ficheiro}
			/>
  
			<!-- Facebook icon -->
			<div class="image-container">
			  <img src={face} alt="Post Image" />
			</div>
		  </div>
		{/if}
		<!-- END IMAGES BLOCK -->
  
		<!-- VIDEOS SECTION (only if we have Facebook videos) -->
		{#if getFacebookVideos().length > 0}
		<h2 class="videos-title">Video:</h2>
		{#each getFacebookVideos() as video}
			<div class="post">
				<!-- Text / hashtags -->
				<p class:expanded>
					{#if noticiaSelecionada.texto_facebook && noticiaSelecionada.texto_facebook.length > 200}
						{noticiaSelecionada.texto_facebook.substring(0, 200)}
						<span class="more-text">
							{noticiaSelecionada.texto_facebook.substring(200)}
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
						{noticiaSelecionada.texto_facebook}
						{#each tagView as tv (tv.id_tag)}
							{#each noticiaSelecionada.pn_noticia_Tag as tag}
								{#if tag.id_tag === tv.id_tag}
									<span>#{tv.nome} </span>
								{/if}
							{/each}
						{/each}
					{/if}
				</p>

				<div class="content-wrapper">
					<!-- Video Player -->
					<video
						class="video_player"
						controls
						src={`/ep/portal_noticias/getFileById?id=${video.id_anexo}`}
					>
						Your browser does not support the video tag.
					</video>

					<!-- Facebook Icon Bar -->
					<div class="image-container">
						<img src={face} alt="Facebook Icon" />
					</div>
				</div>
			</div>
		{/each}
		{/if}
		<!-- END VIDEOS SECTION -->



  
		<!-- COMBINED FALLBACK (only if NO images AND NO videos) -->
		{#if getFacebookImages().length === 0 && getFacebookVideos().length === 0}
		  <div class="post">
			<p class:expanded>
			  {#if noticiaSelecionada.texto_facebook && noticiaSelecionada.texto_facebook.length > 200}
				{noticiaSelecionada.texto_facebook.substring(0, 200)}
				<span class="more-text">
				  {noticiaSelecionada.texto_facebook.substring(200)}
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
				{noticiaSelecionada.texto_facebook}
				{#each tagView as tv (tv.id_tag)}
				  {#each noticiaSelecionada.pn_noticia_Tag as tag}
					{#if tag.id_tag === tv.id_tag}
					  <span>#{tv.nome} </span>
					{/if}
				  {/each}
				{/each}
			  {/if}
			</p>
			<!-- Placeholder image since no Facebook media exist -->
			<img
			  class="imagem_img"
			  src="https://via.placeholder.com/600x600"
			  alt="No Facebook Images"
			/>
		  </div>
		{/if}
		<!-- END COMBINED FALLBACK -->
  
	  </div>
	</div>
  </div>
  
  
  <style>
	/* your same CSS, just keep it once */
	.more-text {
	  display: none;
	}
	.expanded .more-text {
	  display: inline;
	}
	.more-link {
	  color: #385898;
	  cursor: pointer;
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
	  display: flex;
	  justify-content: center;
	  align-items: center;
	  width: 300px;
	  height: 300px;
	  object-fit: cover;
	}
	.container {
	  max-width: 400px;
	  margin: 0 auto;
	  padding: 20px;
	}
	.header {
	  background-color: #3b5998;
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
	/* Make the video scale to the modal width */
	max-width: 100%;
	height: auto;
	/* Optional: if you want it centered, you can do: */
	display: block;
	margin: 0 auto;
	}
	.videos-title {
    font-size: 20px;
    font-weight: bold;
    color: #3b5998; /* Use the same blue as the Facebook header bar */
    margin: 20px 0 10px; /* Some vertical spacing if desired */
  }
  </style>
  