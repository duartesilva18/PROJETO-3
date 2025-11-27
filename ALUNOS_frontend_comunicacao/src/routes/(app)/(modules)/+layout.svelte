<script>
    // @ts-nocheck
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { navigating } from '$app/stores';
	import { fade } from 'svelte/transition';
	import { sidebarOptions } from '$lib/runes/sidebarOptions.rune.svelte';
	import { invalidate } from '$app/navigation';
	import { languageChangedTemp } from '$lib/runes/lang.rune.svelte';
	import { sidebarRune } from '$lib/runes/sidebar.rune.svelte';
	import { pageIds } from '$lib/js/pageIds.conf.js';
    
    
    /** @type {{data: import('./$types').LayoutData, children?: import('svelte').Snippet}} */
    let { data = $bindable(), children } = $props();

    let titulo_sidebar = $state("")
    const manualSidebarModuleIds = new Set(
        pageIds?.portalNoticias?.moduleId ? [pageIds.portalNoticias.moduleId] : []
    );

    $effect(() => {
        if(sidebarOptions.currentModule != titulo_sidebar){
            if(!manualSidebarModuleIds.has(sidebarOptions.currentModuleId)){
                sidebarRune.areas = false
                data.sidebar_areas = false
            }
            titulo_sidebar = sidebarOptions.currentModule
        }
    });

    $effect(() => {
        if(Array.isArray(data.sidebar_modulos) && data.sidebar_modulos.length){
            sidebarRune.modules = data.sidebar_modulos
        }
    })

    $effect(() => {
        if(Array.isArray(data.sidebar_areas) && data.sidebar_areas.length){
            sidebarRune.areas = data.sidebar_areas
        }
    })

    $effect(() => {  
        if(sidebarOptions.currentModuleId){
            document.cookie = `modid=${sidebarOptions.currentModuleId}; path=/; SameSite=Strict`;
		    invalidate("global:layout")
        }
    })
</script>

<svelte:head>
</svelte:head>

<div class="app-body">   
        <!-- Sidebar -->
        {#await sidebarRune.modules}
            <Sidebar areas={false} modulos={false} id_objeto={0} titulo={titulo_sidebar}/>
        {:then items}
            <Sidebar areas={sidebarRune.areas} modulos={sidebarRune.modules} titulo={titulo_sidebar}/>
        {:catch}
            <Sidebar areas={null} modulos={null} id_objeto={0} titulo={titulo_sidebar}/>
        {/await}

    {#if !$navigating && !languageChangedTemp.bool}
        <div class="main" in:fade={{ duration: 300 }}>
            {@render children?.()}
        </div>
    {:else}
        <div class="main">
            <div id="loading-on">
                <span class="dot-on">.</span>
                <span class="dot-on2">.</span>
                <span class="dot-on3">.</span>
            </div>
        </div>
    {/if}
</div>