<script>
	import { goto } from '$app/navigation';
import Breadcrum from '$lib/components/Breadcrum.svelte';
import { t } from '$lib/translations/translations';
	import { onMount } from 'svelte';
	import SuccesModal from '../../noticia/[id]/modals/SuccesModal.svelte';
import { page } from '$app/stores';
import { get } from 'svelte/store';
import { configurePortalSidebar } from '../../sidebar.config.js';
import { sidebarOptions } from '$lib/runes/sidebarOptions.rune.svelte';

const translate = (key) => get(t)(key);
configurePortalSidebar('dashboard', translate);


	const noticiaId = $page.params.id;

	let formField = $state({
		titulo: '',
		descricao: '',
		texto_rs: '',
		id_categoria_FK: '',
		nome_categoria: '',
		texto_facebook: '',
		texto_instagram: '',
		texto_twitter: '',
		texto_linkedin: '',
		texto_tiktok: '',
		anexos: '',
		tags: '',
		id_pedido: 0,
		code: '00000',
	});

	  /**
	 * Array para armazenar as redes sociais.
	 * @type {Array}
	 */
	 let codes = $state([]);


	let redesSociais = $state([]);
	let categorias = $state([]);
	let pedidos = $state([]);
	let tags = $state([]);
	let newTag = $state('');
	let selectedTags = $state([]);
	let anexos = $state([]);
	let updatedAnexos = $state([]);
	let showModal = $state(false);
	let modalMessage = $state('');
	let code = $state([]);

	onMount(async () => {
		const noticia = await fetch(`/ep/portal_noticias/noticia?id=${noticiaId}`).then(d => d.json())
		categorias = await fetch('/ep/portal_noticias/categorias').then(d => d.json())
		pedidos = await fetch('/ep/portal_noticias/getJson').then(d => d.json())

		redesSociais = await fetch('/ep/portal_noticias/redes').then(d => d.json())
		console.log('id_pedido ; ', noticia.id_pedido);
		formField = {
			titulo: noticia.titulo,
			descricao: noticia.texto,
			nome_categoria: noticia.pn_categoria.nome,
			texto_facebook: noticia.texto_facebook,
			texto_instagram: noticia.texto_instagram,
			texto_twitter: noticia.texto_twitter,
			texto_linkedin: noticia.texto_linkedin,
			texto_tiktok: noticia.texto_tiktok,
			id_categoria_FK: noticia.id_categoria_FK,
			id_pedido: noticia.id_pedido,
			anexos: noticia.pn_anexos,
			tags: noticia.pn_noticia_Tag,
		};


		
		

		code = formField.anexos.map(anexo => anexo.code_rede_social);



		redesSociais.forEach((redeSocial) => {
			redeSocial.checked = formField[`texto_${redeSocial.nome.toLowerCase()}`] != null;
		});

		tags = await fetch('/ep/portal_noticias/tags').then(d => d.json())

		tags.forEach((tag) => {
			formField.tags.forEach((tagNoticia) => {
				if (tag.id_tag === tagNoticia.id_tag) {
					selectedTags.push(tag);
				}
			});
		});

		updatedAnexos = formField.anexos.map(file => {
			// Converte o code_rede_social para um array de caracteres
			let codeArray = file.code_rede_social.split('');

			// Mapeia os índices onde há '1' para as respectivas redes sociais
			let redes = [];
			if (codeArray[0] === '1') redes.push('Instagram');
			if (codeArray[1] === '1') redes.push('Facebook');
			if (codeArray[2] === '1') redes.push('Twitter');
			if (codeArray[3] === '1') redes.push('LinkedIn');
			if (codeArray[4] === '1') redes.push('Tiktok');

			// Retorna o objeto atualizado
			return { ...file, redes };
		});

		updateSelectedNetworks(); // Auto-update selected networks
		// Agora cada file em updatedAnexos terá a propriedade "redes" corretamente atribuída.
		console.log("updatedAnexos 1 :", updatedAnexos);

		// Remove the old key from each object
		//updatedAnexos.forEach((anexo) => delete anexo.caminho_ficheiro);
	});

	function getCodeRedeSocial(redes) {
		// We’re hardcoding the order: 0=>Instagram, 1=>Facebook, 2=>Twitter, 3=>LinkedIn, 4=>Tiktok
		const code = ['0', '0', '0', '0', '0'];

		if (redes.includes('Instagram')) code[0] = '1';
		if (redes.includes('Facebook'))  code[1] = '1';
		if (redes.includes('Twitter'))   code[2] = '1';
		if (redes.includes('LinkedIn'))  code[3] = '1';
		if (redes.includes('Tiktok'))    code[4] = '1';
		
			return code.join('');
	
  	}


	function getSelectedSocialNames() {
		return redesSociais
			.filter((redeSocial) => redeSocial.checked)
			.map((redeSocial) => redeSocial.nome);
	}

	function getSelectedSocialNetworks() {
		return redesSociais.filter((redeSocial) => redeSocial.checked);
	}

	function listarNoticias() {
		goto('/noticias');
	}

	function toggleFileNetwork(file, networkName) {
	// If 'file.redes' already includes this network, remove it
		if (file.redes.includes(networkName)) {
			file.redes = file.redes.filter((n) => n !== networkName);
		} else {
			// Otherwise, add it
			file.redes.push(networkName);
	}

	
		updateSelectedNetworks(); // Update buttons when networks are toggled



		console.log('file name:', file.name);
		console.log('file redes:', file.redes);
	}

	function checkifcanornot(file, networkName) {
    // Extrair o tipo do arquivo após o último ponto
		
		if (!file.name) {
    		file.name = file.nome_original_ficheiro; // Atribui nome_original_ficheiro se name não existir
		}

		const typefile = file.name.split('.').pop().toLowerCase();

		let aux = '';
		// Exibir o tipo do arquivo no console
		console.log(`Tipo de arquivo: ${typefile}`);

		for(let j = 0; j < anexos.length; j++){
		if(anexos[j].name == file.name && anexos[j].redes.includes(networkName)){
			return [true, aux];
		}
		}


		for(let i = 0; i < anexos.length; i++) {
		let anexotypefile = anexos[i].name.split('.').pop().toLowerCase();
		if(anexos[i].name != file.name){    
			if(typefile == 'jpg' || typefile == 'png' || typefile == 'jpeg'){
			if (anexos[i].redes.includes(networkName)){
				if(anexotypefile == 'mp4' || anexotypefile == 'mov' || anexotypefile == 'avi'){
				aux = 'imagem invalida para a rede ' + networkName + ' ja se encontra um video associado a rede.';
				return [false , aux];
				}
			}
			}else if(typefile == 'mp4' || typefile == 'mov' || typefile == 'avi'){
			if (anexos[i].redes.includes(networkName)){
				if(anexotypefile == 'jpg' || anexotypefile == 'png' || anexotypefile == 'jpeg'){
				aux = 'video invalida para a rede ' + networkName + ' ja se encontra uma imagem associada a rede.';
				return [false , aux];
				}
				if(anexotypefile == 'mp4' || anexotypefile == 'mov' || anexotypefile == 'avi'){
				aux = 'video invalida para a rede ' + networkName + ' ja se encontra um video associado a rede.';
				return [false, aux];
				}
			}
			}
		}
		}
		return [true, aux]; // Retorna o tipo de arquivo, caso necessário
	}



	async function onHandleSubmit(event) {
		event.preventDefault();
		debugger

		const titulo = formField.titulo;
		const descricao = formField.descricao;
		const estado = 'Pendente';
		const id_categoria_FK = formField.id_categoria_FK;
		const texto_facebook = formField.texto_facebook;
		const texto_instagram = formField.texto_instagram;
		const texto_twitter = formField.texto_twitter;
		const texto_linkedin = formField.texto_linkedin;
		const texto_tiktok = formField.texto_tiktok;
		const selectedSocialNetworks = getSelectedSocialNetworks();
		const getSelectedSocialNetworksNames = getSelectedSocialNames();
		const tags = selectedTags;
		const id_pedido = formField.id_pedido;
		const formDataAnexos = new FormData();
		console.log("anexos 1 :", updatedAnexos);


		anexos.forEach((file) => {
			console.log("file :", file);

			console.log("file.redes 1 :", file.redes);

			file.codeRede = getCodeRedeSocial(file.redes);
			const code = getCodeRedeSocial(file.redes); 
			codes.push(code);

     	});

		

			let anexosUploaded = [];
			if (anexos.length > 0) {
				
				anexos.forEach((anexo, index) => {
					formDataAnexos.append('files', anexo);
					
				});
				formDataAnexos.append('codes', JSON.stringify(codes));

				
				const fileInfo = anexos.map((file) => ({
					originalName: file.name,
					codeRede: file.codeRede
				}));

				formDataAnexos.append('fileInfo', JSON.stringify(fileInfo));

				const options = {
					method: 'POST',
					body: formDataAnexos,
					headers: {
						'Accept': 'application/json',
					},
				};
				anexosUploaded = await fetch('/ep/portal_noticias/anexos',options).then(d => d.json())
			}

			const updatedNoticia = { 
				titulo: String(titulo),
				texto: String(descricao),
				estado: String(estado),
				id_categoria_FK: String(id_categoria_FK),
				redesSociais: selectedSocialNetworks, // Ensure this is an array
				tags: tags, // Ensure this is an array
				id_pedido: id_pedido,
				anexos: [...updatedAnexos, ...(Array.isArray(anexosUploaded) ? anexosUploaded : [])] // Ensure anexosUploaded is an array
			};
			
			// Adiciona textos das redes sociais apenas se não forem nulos e estiverem nas redes selecionadas
			if (getSelectedSocialNetworksNames.includes('Facebook') && texto_facebook != '')
				updatedNoticia.texto_facebook = texto_facebook;
			else updatedNoticia.texto_facebook = null;
			if (getSelectedSocialNetworksNames.includes('Instagram') && texto_instagram != '')
				updatedNoticia.texto_instagram = texto_instagram;
			else updatedNoticia.texto_instagram = null;
			if (getSelectedSocialNetworksNames.includes('Twitter') && texto_twitter != '')
				updatedNoticia.texto_twitter = texto_twitter;
			else updatedNoticia.texto_twitter = null;
			if (getSelectedSocialNetworksNames.includes('LinkedIn') && texto_linkedin != '')
				updatedNoticia.texto_linkedin = texto_linkedin;
			else updatedNoticia.texto_linkedin = null;
			if (getSelectedSocialNetworksNames.includes('Tiktok') && texto_tiktok != '')
				updatedNoticia.texto_tiktok = texto_tiktok;
			else updatedNoticia.texto_tiktok = null;

				await fetch(`/ep/portal_noticias/dados?id_noticia=${noticiaId}`,{
					method: 'PUT',
					body: JSON.stringify(updatedNoticia)
				})
			toastr.success('Adicionou uma noticia com sucesso!','SUCESSO!',{ timeOut: 5000, progressBar: true})
			goto('/portal_noticias')
			// goto('/noticias');

	
}

	function handleFileChange(event) {
		const files = event.target.files;
		anexos = [...anexos];

		for (let i = 0; i < files.length; i++) {
			// Cria uma URL de objeto para o arquivo atual
			const fileUrl = URL.createObjectURL(files[i]);
			// Adiciona a URL como uma propriedade do objeto do arquivo
			files[i].url = fileUrl;
			files[i].redes = [];
			// Adiciona o arquivo modificado ao array anexos
			anexos.push(files[i]);
		}
		console.log('Anexos selecionados:', anexos);
		updateSelectedNetworks(); // Update buttons when files are added
	}

	function handleSelectTag(tag) {
		const index = selectedTags.findIndex((selectedTag) => selectedTag.id_tag === tag.id_tag);
		if (index === -1) {
			selectedTags = [...selectedTags, tag];
		} else {
			selectedTags.splice(index, 1);
			selectedTags = [...selectedTags];
		}
		console.log('Tags selecionadas:', formField);
	}

	async function handleAddTag() {
		console.log('Adicionando tag:', newTag);
		if (newTag.trim() !== '') {
			const existingTag = tags.find((tag) => tag.nome === newTag);
			if (existingTag) {
				if (existingTag.status === 'Ativo') {
					console.log('A tag já existe e está ativa.');
				} else {
					console.log('A tag já existe, mas está inativa, Será ativada.');
					await fetch(`/ep/portal_noticias/tags/activate?id_tag=${existingTag.id_tag}`)
					existingTag.status = 'Ativo';
					tags = [...tags];
					console.log(existingTag.nome, 'ativada');
				}
			} else {
				const addedTag = await fetch('/ep/portal_noticias/tags',{
					method: 'POST',
					body: JSON.stringify({ nome: newTag })
				}).then(d => d.json())//addTag(newTag);

				if (addedTag) {
					tags = [...tags, addedTag];
					newTag = '';
				}
			}
		}
	}

	async function handleRemoveTag(tagToRemove) {
		const removed = await fetch(`/ep/portal_noticias/tags?id_tag=${tagToRemove.id_tag}`,{method:"DELETE"})//removeTag(tagToRemove.id_tag);
		if (removed) {
			tags = tags.filter((tag) => tag.id_tag !== tagToRemove.id_tag);
			tags = [...tags];
		}
	}

	function removeFile(index) {
		updatedAnexos.splice(index, 1);
		updatedAnexos = [...updatedAnexos];
	}

	function removeFileUploaded(index) {
		anexos.splice(index, 1);
		anexos = [...anexos];
	}

	function handleCloseModal() {
		showModal = false;
	}

	function updateSelectedNetworks() {
		// Reset all networks to unchecked
		redesSociais.forEach(network => network.checked = false);

		// Check which networks are selected in uploaded files
		[...updatedAnexos, ...anexos].forEach(file => {
			file.redes?.forEach(networkName => {
			let network = redesSociais.find(n => n.nome === networkName);
			if (network) {
				network.checked = true;
			}
			});
		});
	}


	let items_breadcrum = $derived([
		{
			icon_class: 'fas fa-list',
			url: '#',
			designacao: $t('divPublicar.listar'),
			function: listarNoticias
		}
	]);
</script>
<style>
	@import "../../portal_noticias.css";
	.texto-input {
  height: 200px; /* Doubled size for text input */
  resize: vertical; /* Allows manual resizing */
}

.char-counter {
  font-size: 12px;
  color: gray;
  margin-bottom: 5px; /* Moves counter closer to input */
  text-align: right; /* Aligns counter to the right */
}

.selected-file {
  background-color: #f8f9fa;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-bottom: 10px;
  position: relative;
  display: flex;
  flex-direction: column;
}

.file-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 5px;
}

.file-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #007bff;
}

.file-link i {
  margin-right: 8px;
}

.btn-delete {
  background: none;
  border: none;
  color: red;
  cursor: pointer;
  font-size: 16px;
}

.btn-delete:hover {
  color: darkred;
}

.file-networks {
  display: flex;
  flex-wrap: wrap;
  gap: 5%; /* More spacing between checkboxes */
  justify-content: center; /* Center-align checkboxes */
  padding-top: 10px;
}

.file-networks label {
  display: flex;
  align-items: center;
  gap: 5px; /* Space between checkbox and label text */
  font-size: 14px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 5px;
  transition: background 0.3s;
}

.file-networks label:hover {
  background: #f0f0f0;
}

</style>


<Breadcrum
	modulo={sidebarOptions.currentModule}
	objeto={sidebarOptions.currentObject}
	menu_items={items_breadcrum}
/>
<div class="container-fluid mt-4">
	<form onsubmit={onHandleSubmit} class="form-container">
		<div class="row">
			<div class="col-md-6">
				<div class="form-group">
					<label for="tituloInput">{$t('divPublicar.Titulo')}:</label>
					<input
						class="form-control"
						type="text"
						id="tituloInput"
						name="tituloInput"
						required
						bind:value={formField.titulo}
						oninput={(e) => formField.titulo = e.target.value.slice(0, 100)}
						maxlength="100"
					/>
					<!-- Character Counter (Above the Input) -->
					<p class="char-counter">{formField.titulo.length} / 100</p>
				</div>
				<div class="form-group">
					<label for="areatext">{$t('divPublicar.Texto')}:</label>
					<textarea
						class="form-control texto-input"
						id="areatext"
						name="textInput"
						required
						bind:value={formField.descricao}
						oninput={(e) => formField.descricao = e.target.value.slice(0, 10000)}
						maxlength="10000"
					></textarea>
					<!-- Character Counter (Above the Textarea) -->
					<p class="char-counter">{formField.descricao.length} / 10000</p>
				</div>

				<div class="form-group">
					<label>{$t('divPublicar.Categorias')}:</label>
					<select bind:value={formField.id_categoria_FK} class="form-control">
						<option value="">{$t('divPublicar.selCategoria')}</option>
						{#each categorias.filter((categoria) => categoria.status === 'Ativo') as categoria}
							<option value={categoria.id_categoria}>{categoria.nome}</option>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label>{$t('divPublicar.Pedidos')}:<span style="color: red;">*</span></label>
					<select bind:value={formField.id_pedido} class="form-control" required>
					  <option value="">{$t('divPublicar.selPedido')}</option>
					  {#each pedidos as pedido}
						<option value={pedido.id}>{pedido.assunto}</option>
					  {/each}
					</select>
				  </div>


				<div class="form-group">
					<label for="fileInput">{$t('divPublicar.Anexos')}:</label>
					<input
						class="form-control file-input"
						type="file"
						id="fileInput"
						name="fileInput"
						placeholder={$t('divPublicar.inAnexos')}
						onchange={(event) => handleFileChange(event)}
						multiple
					/>

					{#if updatedAnexos.length > 0 || anexos.length > 0}
					<div class="selected-files mt-3">
						<label for="fileInput" class="form-label">{$t('divPublicar.sAnexos')}:</label>

						{#each [...updatedAnexos, ...anexos] as file, index}
						<div class="selected-file">
							<div class="file-header">
							<a href={file.url ? file.url : `/ep/portal_noticias/getFileById?id=${file.id_anexo}`} target="_blank" class="file-link">
								<i class="fas fa-file-alt"></i> {file.nome_original_ficheiro || file.name}
							</a>
							<button
								type="button"
								class="btn-delete"
								onclick={() => (file.id_anexo ? removeFile(index) : removeFileUploaded(index))}
							>
								<i class="fa fa-trash"></i>
							</button>
							</div>

							<div class="file-networks">
							{#each ['Instagram', 'Facebook', 'Twitter', 'LinkedIn', 'Tiktok'] as network}
								<label>
								<input
									type="checkbox"
									checked={file.redes.includes(network)}
									onchange={(event) => {
									const [canToggle, message] = checkifcanornot(file, network);
									if (canToggle) {
										toggleFileNetwork(file, network);
									} else {
										event.target.checked = file.redes.includes(network);
										alert(message);
									}
									}}
								/>
								{network}
								</label>
							{/each}
							</div>
						</div>
						{/each}
					</div>
					{:else}
					<div class="alert alert-info mt-1" role="alert">
						<i class="fas fa-info-circle"></i>
						{$t('divEditar.noAnexos')}
					</div>
					{/if}

				</div>
			</div>

			<div class="col-md-6 form-group">
				<label for="Rs">{$t('divPublicar.rs')}:</label>
				<div class="social-media-container" style="display: flex; flex-wrap: wrap;">
					{#each redesSociais as redeSocial}
					  <div class="social-media-button m-2">
						<button
						  type="button"
						  class="btn btn-outline-primary"
						  class:active={redeSocial.checked}
						  onclick={() => (redeSocial.checked = !redeSocial.checked)}
						>
						  {redeSocial.nome}
						</button>
					  </div>
					{/each}
				  </div>
				<div class="form-group">
					{#if redesSociais.filter((redeSocial) => redeSocial.checked)}
						<div class="form-group tags-input" style="margin-top: 20px;">
							{#each redesSociais as redeSocial}
								{#if redeSocial.checked}
									<div class="form-group">
										<label for={`texto-${redeSocial.id}`}>
											{$t('divPublicar.textoPara')}
											{redeSocial.nome}:
										</label>
										<textarea
											class="form-control"
											id={`texto-${redeSocial.id}`}
											bind:value={formField[`texto_${redeSocial.nome.toLowerCase()}`]}
										></textarea>
									</div>
								{/if}
							{/each}
							<label for="tagsInput">
								{#if redesSociais.filter((redeSocial) => redeSocial.checked)}
									{$t('divPublicar.tagsPara')}
									{#each redesSociais.filter((redeSocial) => redeSocial.checked) as redeSocial}
										{redeSocial.nome}
										{#if redesSociais.filter((redeSocial) => redeSocial.checked).length > 1}
											{#if redeSocial !== redesSociais.filter((redeSocial) => redeSocial.checked)[0]}
												{#if redeSocial !== redesSociais.filter((redeSocial) => redeSocial.checked)[redesSociais.filter((redeSocial) => redeSocial.checked).length - 1]}
													{', '}
												{/if}
											{/if}
										{/if}
									{/each}
								{/if}
							</label>
							<div class="available-tags">
								{#each tags.filter((tag) => tag.status === 'Ativo') as tag}
									<div
										class="tag {selectedTags.some(
											(selectedTag) => selectedTag.id_tag === tag.id_tag
										)
											? 'selected'
											: ''}"
										class:selected={selectedTags.some(
											(selectedTag) => selectedTag.id_tag === tag.id_tag
										)}
										class:bordered={selectedTags.some(
											(selectedTag) => selectedTag.id_tag === tag.id_tag
										)}
									>
										<span
											role="button"
											aria-label={$t('divPublicar.selTag')}
											tabindex="0"
											onkeydown={(e) => {
												if (e.key === 'Enter' || e.key === ' ') {
													handleSelectTag(tag);
												}
											}}
											onclick={() => handleSelectTag(tag)}
										>
											{tag.nome}
										</span>
										<span
											role="button"
											aria-label={$t('divPublicar.removerTag')}
											tabindex="0"
											class="remove-icon"
											onkeydown={(e) => {
												if (e.key === ' ') {
													handleRemoveTag(tag);
												}
											}}
											onclick={(e) => {
												e.stopPropagation();
												handleRemoveTag(tag);
											}}
										>
											x
										</span>
									</div>
								{/each}
							</div>
							<div class="tag-input" style="display: flex; align-items: center; gap: 10px;">
								<input
									class="form-control"
									type="text"
									id="tagsInput"
									name="tagsInput"
									placeholder={$t('divPublicar.selTag')}
									bind:value={newTag}
								/>
								<button
									type="button"
									class="btn btn-secondary custom-button"
									onclick={handleAddTag}
								>
									<span class="icon">+</span>
									{$t('divPublicar.addTag')}
								</button>
							</div>
						</div>
					{/if}
				</div>
				<div class="col-md-12 text-md-right">
					<button
						type="submit"
						class="btn btn-primary btn-lg get-source"
						style="margin-top: 30px; position: relative; padding-left: 50px;"
					>
						<i
							class="fas fa-paper-plane"
							style="position: absolute; left: 20px; top: 50%; transform: translateY(-50%);"
						></i>
						{$t('divEditar.editarNoticia')}
					</button>
				</div>
			</div>
		</div>
	</form>
</div>
<SuccesModal show={showModal} message={modalMessage} onClose={handleCloseModal} />
