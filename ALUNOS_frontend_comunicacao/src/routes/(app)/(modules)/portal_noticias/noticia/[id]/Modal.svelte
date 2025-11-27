<script>
    import { fade, fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";
  
  /** @type {{open?: boolean, showBackdrop?: boolean, onClosed: any, title?: string, children?: import('svelte').Snippet}} */
  let {
    open = $bindable(false),
    showBackdrop = true,
    onClosed,
    title = 'Modal title',
    children
  } = $props();
  
    const modalClose = (data) => {
      open = false;
      if (onClosed) {
        onClosed(data);
      }
    }
  
  </script>
  
  
  {#if open}
    <div class="modal" id="sampleModal" tabindex="-1" role="dialog" aria-labelledby="sampleModalLabel" aria-hidden={false}>
        <div class="modal-dialog" role="document" in:fly={{ y: -50, duration: 300 }} out:fly={{ y: -50, duration: 300, easing: quintOut }}>
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="sampleModalLabel">{title}</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close" onclick={() => modalClose('close')}>
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    {@render children?.()}
                </div>
            </div>
        </div>
    </div>

    {#if showBackdrop}
        <div class="modal-backdrop show" transition:fade={{ duration: 150 }}></div>
    {/if}
{/if}
  
  <style>
    .modal {
      display: block;
    }
    .modal-body {
        overflow: auto;
        max-height: 70vh; /* Ajuste conforme necessário */
    }
  </style>