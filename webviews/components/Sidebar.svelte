<script>
    import { onMount } from 'svelte';
    import { vscode } from '../components/vscode';

    export let files = [];
    export let selectedFiles = [];
    export let tokenCount = 0;
    const totalTokens = 1000;

    let isFilesVisible = true;
    let isTokensVisible = true;
    let isOwaspApiVisible = true;
    let isOwaspTop10Visible = true;
    let arrowIconUri = '';

    $: rotation = isFilesVisible || isTokensVisible || isOwaspApiVisible || isOwaspTop10Visible ? '90deg' : '0deg';

    console.log('Svelte component loaded');

    function handleCheckboxChange(event, file) {
        const isChecked = event.target.checked;
        if (isChecked && !selectedFiles.includes(file)) {
            selectedFiles = [...selectedFiles, file];
        } else {
            selectedFiles = selectedFiles.filter(f => f !== file);
        }
        console.log('Selected files:', selectedFiles);
    }

    function isSelected(file) {
        return selectedFiles.includes(file);
    }

    function calculateTokens() {
        console.log('Calculating tokens for selected files:', selectedFiles);
        vscode.postMessage({ type: 'calculateTokens', files: selectedFiles });
    }

    function toggleVisibility(section) {
        switch (section) {
            case 'files':
                isFilesVisible = !isFilesVisible;
                break;
            case 'tokens':
                isTokensVisible = !isTokensVisible;
                break;
            case 'owaspApi':
                isOwaspApiVisible = !isOwaspApiVisible;
                break;
            case 'owaspTop10':
                isOwaspTop10Visible = !isOwaspTop10Visible;
                break;
        }
    }

    onMount(() => {
        console.log('Svelte component mounted');
        vscode.postMessage({ type: 'getFiles' });

        window.addEventListener('message', event => {
            const message = event.data;
            console.log('Message received from extension:', message);

            switch (message.type) {
                case 'files':
                    files = message.files;
                    break;
                case 'tokenCount':
                    tokenCount = message.tokens;
                    break;
            }
        });
    });

    $: remainingTokens = totalTokens - tokenCount;
</script>

<div id="content">
    <div class="section">
        <button class="section-header" on:click={() => toggleVisibility('files')}>
            <img src="{arrowIconUri}" class="toggle-icon" style="transform: rotate({rotation});" alt="Toggle" />
            Check files to scan:
        </button>
        {#if isFilesVisible}
            {#each files as file}
                <label>
                    <input type="checkbox" checked={isSelected(file)} on:change={(event) => handleCheckboxChange(event, file)} />
                    {file}
                </label>
            {/each}
            <button class="calculate-btn" on:click={calculateTokens}>Calculate Tokens</button>
        {/if}
    </div>

    <div class="section">
        <button class="section-header" on:click={() => toggleVisibility('tokens')}>
            <img src="{arrowIconUri}" class="toggle-icon" style="transform: rotate({rotation});" alt="Toggle" />
            Tokens:
        </button>
        {#if isTokensVisible}
            <h3>Total: {totalTokens}</h3>
            <h3>Used: {tokenCount}</h3>
            <h3>Remaining: {remainingTokens}</h3>
        {/if}
    </div>

    <div class="section">
        <button class="section-header" on:click={() => toggleVisibility('owaspApi')}>
            <img src="{arrowIconUri}" class="toggle-icon" style="transform: rotate({rotation});" alt="Toggle" />
            OWASP API
        </button>
        {#if isOwaspApiVisible}
            <!-- Add content for OWASP API here -->
        {/if}
    </div>

    <div class="section">
        <button class="section-header" on:click={() => toggleVisibility('owaspTop10')}>
            <img src="{arrowIconUri}" class="toggle-icon" style="transform: rotate({rotation});" alt="Toggle" />
            OWASP Top 10
        </button>
        {#if isOwaspTop10Visible}
            <!-- Add content for OWASP Top 10 here -->
        {/if}
    </div>
</div>

<style>
  .section-header {
    font-size: 1.5em;
    margin: 3px 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    background: none;
    border: none;
    color: inherit;
    padding: 0;
    text-align: left;
    margin-bottom: 15px;
  }

  .toggle-icon {
    width: 10px;
    height: 10px;
    transition: transform 0.3s;
    margin-right: 2px;
  }

  label {
    display: block;
    margin: 3.5px 0;
    align-items: center;
    margin-bottom: 5px;
  }

  .section {
    margin-bottom: 30px;
  }

  input[type='checkbox'] {
    accent-color: black !important;
    border-color: 2px solid white !important;
    background-color: black !important;
    width: 16px !important;
    height: 16px !important;
    cursor: pointer !important;
  }

  input[type='checkbox']:checked {
    background-color: black !important;
    border-color: 5px solid white !important;
  }

  .calculate-btn {
    border: 1px solid white !important;
    padding: 6px 4px !important;
    width: 100% !important;
    text-align: center !important;
    outline: 1px solid transparent !important;
    outline-offset: 2px !important;
    color: white !important;
    background: black !important;
  }

  .calculate-btn:hover {
    cursor: pointer !important;
    background: black !important;
  }

  .section-header:hover {
    background: none !important;
  }

  .calculate-btn:focus {
    outline-color: white !important;
  }
</style>
