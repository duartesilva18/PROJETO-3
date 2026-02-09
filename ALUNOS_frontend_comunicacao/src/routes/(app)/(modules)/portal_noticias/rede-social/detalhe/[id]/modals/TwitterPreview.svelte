<script>
	import { onMount } from 'svelte';
	import logo_IPVC from './logos/logo_IPVC.jpg';
	import twitterlogo from './logos/twitterbar.png';

	console.log('twitterlogo =>', twitterlogo);

	/** @type {{noticiaSelecionada?: any}} */
	let { noticiaSelecionada = {} } = $props();

	let tagView = $state([]);
	let currentIndex = $state(0);
	let expanded = false;

	const toggleExpanded = () => {
		expanded = !expanded;
	};

	onMount(async () => {
		tagView = await fetch('/ep/portal_noticias/tags').then((d) => d.json());
	});

	/**
	 * Check if an anexo is for Twitter.
	 * Twitter is charAt(2) === '1' (assuming the code is "0=>Insta, 1=>FB, 2=>Twitter, 3=>LinkedIn").
	 */
	function isForTwitter(anexo) {
		return anexo.code_rede_social && anexo.code_rede_social.charAt(2) === '1';
	}

	/**
	 * Return ONLY Twitter images.
	 */
	/*function getTwitterImages() {
		if (!noticiaSelecionada.pn_anexos) {
			return [];
		}

		return noticiaSelecionada.pn_anexos.filter(
			(anexo) => anexo.tipo?.startsWith('image/') && isForTwitter(anexo)
		);
	}*/
    function getTwitterImages() {
        if (!noticiaSelecionada.pn_anexos) {
            return [];
        }
        const images = noticiaSelecionada.pn_anexos.filter(
            (anexo) => anexo.tipo?.startsWith('image/') && isForTwitter(anexo)
        );
        console.log("Twitter images:", images);
        return images;
    }


	function getTwitterVideos() {
		if (!noticiaSelecionada.pn_anexos) {
			return [];
		}
		return noticiaSelecionada.pn_anexos.filter(
			(anexo) => anexo.tipo?.startsWith('video/') && isForTwitter(anexo)
		);
	}



	/**
	 * Move to the next image in the Twitter images array.
	 */
	function nextImage() {
		const images = getTwitterImages();
		if (currentIndex < images.length - 1) {
			currentIndex++;
		}
	}

	/**
	 * Move to the previous image in the Twitter images array.
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
	  <!-- Title text in Twitter’s color -->
	  <h1>Twitter</h1>
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
  
		<!-- IMAGES BLOCK (only if there are Twitter images) -->
		{#if getTwitterImages().length > 0}
		  <div class="post">
  
			{#if getTwitterImages().length > 1}
			  <div class="image-menu">
				<button on:click={previousImage} disabled={currentIndex === 0}>❮</button>
				<button
				  on:click={nextImage}
				  disabled={currentIndex === getTwitterImages().length - 1}
				>
				  ❯
				</button>
			  </div>
			{/if}
  
			<!-- Show the current Twitter image -->
			<img
			  class="imagem_img"
			  src={`/ep/portal_noticias/getFileById?id=${getTwitterImages()[currentIndex].id_anexo}`}
			  alt={getTwitterImages()[currentIndex].nome}
			/>
  
			<!-- (Optional) Twitter branding, if you have a logo -->
			<div class="branding">
				<img src={twitterlogo} alt="Twitter branding" />
			</div> 
  
			<!-- Text / hashtags (using noticiaSelecionada.texto_twitter) -->
			<p>
			  {noticiaSelecionada.texto_twitter}
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
		{#if getTwitterVideos().length > 0}
		<h2 class="videos-title">Video:</h2>
		{#each getTwitterVideos() as video}
			<div class="post">
				<!-- Video Player -->
				<video
					class="video_player"
					controls
					src={`/ep/portal_noticias/getFileById?id=${video.id_anexo}`}
				>
					Your browser does not support the video tag.
				</video>

				<!-- Twitter Branding -->
				<div class="branding">
					<img src={twitterlogo} alt="Twitter branding" />
				</div>

				<!-- Text / hashtags -->
				<p>
					{noticiaSelecionada.texto_twitter}
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
		{#if getTwitterImages().length === 0 && getTwitterVideos().length === 0}
		  <div class="alert alert-danger" role="alert">
			<i class="fas fa-exclamation-triangle"></i>
			Noticias sem imagens/vídeos anexados não poderão ser publicadas na rede social Twitter
		  </div>
		  <div class="post">
			<!-- Fallback placeholder -->
			<img src="https://via.placeholder.com/600x600" alt="Placeholder" />
			 <!--<div class="branding">
			  <img src={twitterlogo} alt="Twitter branding" />
			</div> -->
			<p>
			  {noticiaSelecionada.texto_twitter}
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
	/* Container, etc. */
	.container {
	  max-width: 400px;
	  margin: 0 auto;
	  padding: 20px;
	  font-family: Arial, sans-serif;
	}
  
	.header {
	  background-color: transparent; /* Could be #1DA1F2 if you want a solid bar */
	  color: #1DA1F2; /* Twitter color for text */
	  padding: 10px 20px;
	  display: flex;
	  align-items: center;
	  border-radius: 6px;
	  justify-content: space-between;
	}
  
	.header h1 {
	  color: #1DA1F2;
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
  
	.imagem_img {
	  display: block;
	  width: 300px;
	  height: 300px;
	  margin: 0 auto;
	  object-fit: cover;
	  border-radius: 5px;
	}
  
	/* If you want a branding image: */
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

	.icons-image {
		width: 300px; /* Adjust this size as needed */
		object-fit: contain;
	}
  
	.videos-title {
	  font-size: 20px;
	  font-weight: bold;
	  color: #1DA1F2;
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
