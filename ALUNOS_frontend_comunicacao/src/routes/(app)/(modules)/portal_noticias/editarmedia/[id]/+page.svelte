<script>
	import { goto } from '$app/navigation';
	import Breadcrum from '$lib/components/Breadcrum.svelte';
	import { locale, t } from '$lib/translations/translations';
import { onMount , tick } from 'svelte';
	import SuccesModal from '../../noticia/[id]/modals/SuccesModal.svelte';
import { page } from '$app/stores';
import { get } from 'svelte/store';
	import "select2";
import { configurePortalSidebar } from '../../sidebar.config.js';

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
		emails: '',
	});

	 /**
	 * Array para armazenar as categorias.
	 * @type {Array}
	 */
	 let radio_jornal = $state([]);

	 /**
	 * @type {Array}
	 */
	 let selectedradiosjornais = $state([]);



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
		radio_jornal = await fetch('/ep/portal_noticias/radio_jornal').then(d => d.json())

		redesSociais = await fetch('/ep/portal_noticias/redes').then(d => d.json())
		
 

		
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
			emails: noticia.emails,
		};

		selectedradiosjornais = formField.emails.split(',');
		console.log('selectedradiosjornais : ', selectedradiosjornais);
		await tick(); // Aguarda a renderização do select

		// Atualiza a seleção manualmente no select
		const select = document.getElementById("unidinvestigacao");
		if (select) {
		for (let option of select.options) {
			option.selected = selectedradiosjornais.includes(option.value);
		}
		}

		// Inicializa o Select2 após a renderização
		jQuery("#unidinvestigacao").select2();
		jQuery("#unidinvestigacao").on("change", selecionarRadioJornal);

		// Atualiza a seleção no Select2
		jQuery("#unidinvestigacao").val(selectedradiosjornais).trigger("change");

		// Inicializa o Select2 com idioma e tema Bootstrap
		jQuery(".select2-single-multi").select2({
		theme: "bootstrap",
		language: locale.get() === "pt" ? "pt" : "en"
		});

		code = formField.anexos.map(anexo => anexo.code_rede_social);

	
		console.log('emails : ', formField.emails);

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

	




		console.log('file name:', file.name);
		console.log('file redes:', file.redes);
	}

	function selecionarRadioJornal(event) {
    	console.log("Select2 - Função chamada!");
		selectedradiosjornais = globalThis.$(event.target).val() || [];
		console.log("selectedradiosjornais 2 :", selectedradiosjornais);
	}

	function removerRadioJornal(id) {
		selectedradiosjornais = selectedradiosjornais.filter(rj => rj !== id);
		console.log("selectedradiosjornais:", selectedradiosjornais);
	}

	function getNomeById(id) {
		const item = radio_jornal.find(rj => rj.id_radio_jornal === id);
		return item ? item.nome : "Desconhecido";
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
				emails : selectedradiosjornais.join(','),
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
  height: 200px; /* Makes the text area taller */
  resize: vertical; /* Allows manual resizing */
}

.char-counter {
  font-size: 12px;
  color: gray;
  margin-bottom: 5px; /* Spaces it right above the input */
  text-align: right; /* Aligns to the right side */
}









.selected-radios-container {
  max-width: 100%; /* Keeps it responsive */
  height: 45px; /* ✅ Fixed height */
  overflow-x: auto; /* ✅ Enables horizontal scrolling */
  overflow-y: hidden; /* ✅ Prevents vertical scrolling */
  white-space: nowrap; /* Prevents wrapping */
  padding: 5px 10px; /* ✅ Adds padding inside the box */
  border: 1px solid #ccc;
  border-radius: 6px;
  display: flex;
  align-items: center;
  background-color: #f9f9f9;
  margin-bottom: 10px; /* ✅ Adds spacing between the two boxes */
}

/* ✅ Ensures the scrollbar does not overlap the radio/jornal tags */
.selected-radios-container::-webkit-scrollbar {
  height: 6px; /* ✅ Smaller scrollbar */
}

.selected-radios-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

.selected-radios-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.selected-radios {
  display: flex;
  gap: 8px;
}

.radio-tag {
  display: flex;
  align-items: center;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  white-space: nowrap; /* Prevents text from wrapping */
}

/* ✅ Ensures remove button is properly aligned */
.radio-tag button {
  background: none;
  border: none;
  color: red;
  font-weight: bold;
  margin-left: 8px;
  cursor: pointer;
}

.radio-tag button:hover {
  color: darkred;
}


</style>


<Breadcrum modulo={1} objeto={1} menu_items={items_breadcrum} />
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
					<p class="char-counter">{formField.descricao.length} / 10000</p>
				</div>

				<div class="form-group">
					<label>{$t('divPublicar.radiosjornais')}:<span style="color: red;">*</span></label>
				  
					
				  
					<select 
						name="investigation_unit_id" 
						id="unidinvestigacao" 
						class="form-control select2-single-multi" 
						multiple 
						bind:value={selectedradiosjornais}
						>
						{#each radio_jornal as rj}
							<option value={rj.id_radio_jornal}>{rj.nome}</option>
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
						{#if updatedAnexos.length > 0}
							<div class="selected-files mt-3" style="max-width: 600px; margin: 0 auto;">
								<label class="form-label">{$t('divEditar.anexosExistentes')}</label>
								{#each updatedAnexos as file, index (file)}
									<div
										class="selected-file d-flex align-items-center justify-content-between mt-2 p-2 border rounded"
										id="sFile-{index}"
										style="background-color: #f8f9fa; padding: 10px; border: 1px solid #ddd; border-radius: 5px;"
									>
										<a
											href={`/ep/portal_noticias/getFileById?id=${file.id_anexo}`}
											target="_blank"
											class="file-link d-flex align-items-center text-decoration-none"
											style="font-weight: 500; color: #007bff; text-decoration: none;"
										>
											<i
												class="fas fa-file-alt me-2 text-primary"
												style="margin-right: 10px; font-size: 1.2em;"
											></i>
											{file.nome_original_ficheiro}
										</a>
										<button
											type="button"
											onclick={() => removeFile(index)}
											class="btn btn-sm btn-outline-danger"
											style="display: flex; align-items: center; justify-content: center;"
										>
											<i class="fa fa-trash"></i>
										</button>
										
										





									</div>
								{/each}
							</div>
						{/if}
						{#if anexos.length > 0}
							<div class="selected-files mt-3" style="max-width: 600px; margin: 0 auto;">
								<label class="form-label" for="Rs">{$t('divEditar.anexosUpload')}</label>
								{#each anexos as file, index (file)}
									<div
										class="selected-file d-flex align-items-center justify-content-between mt-2 p-2 border rounded"
										id="sFile-{index}"
										style="background-color: #f8f9fa; padding: 10px; border: 1px solid #ddd; border-radius: 5px;"
									>
										<a
											href={file.url}
											target="_blank"
											class="file-link d-flex align-items-center text-decoration-none"
											style="font-weight: 500; color: #007bff; text-decoration: none;"
										>
											<i
												class="fas fa-file-alt me-2 text-primary"
												style="margin-right: 10px; font-size: 1.2em;"
											></i>
											{file.name}
										</a>
										
										
										
										<button
											type="button"
											onclick={() => removeFileUploaded(index)}
											class="btn btn-sm btn-outline-danger"
											style="display: flex; align-items: center; justify-content: center;"
										>
											<i class="fa fa-trash"></i>
										</button>
										
										
										





									</div>
									
							
									
								
								{/each}
							</div>
						{/if}
					{:else}
						<div class="alert alert-info mt-1" role="alert">
							<i class="fas fa-info-circle"></i>
							{$t('divEditar.noAnexos')}
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
