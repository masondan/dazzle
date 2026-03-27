<script>
	import { inventoryStore } from '$lib/stores/inventory.svelte.js';
	import ProductForm from './ProductForm.svelte';
	import ProductList from './ProductList.svelte';

	let showForm = $state(false);
	let editingProduct = $state(null);
	let searchQuery = $state('');
	let filterType = $state('dateDesc');
	let toastMessage = $state('');

	let filteredProducts = $derived.by(() => {
		let result = [...inventoryStore.products];

		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			result = result.filter(p =>
				p.name.toLowerCase().includes(q) ||
				p.id.toLowerCase().includes(q)
			);
		}

		if (filterType === 'priceHigh') {
			result.sort((a, b) => b.retailPrice - a.retailPrice);
		} else if (filterType === 'priceLow') {
			result.sort((a, b) => a.retailPrice - b.retailPrice);
		} else if (filterType === 'dateDesc') {
			result.sort((a, b) => parseDate(b.dateEntered) - parseDate(a.dateEntered));
		} else if (filterType === 'dateAsc') {
			result.sort((a, b) => parseDate(a.dateEntered) - parseDate(b.dateEntered));
		}

		return result;
	});

	function parseDate(dateStr) {
		if (!dateStr) return 0;
		if (dateStr.includes('-')) return new Date(dateStr).getTime();
		const parts = dateStr.split('/');
		if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
		return 0;
	}

	function showToast(msg) {
		toastMessage = msg;
		setTimeout(() => { toastMessage = ''; }, 2500);
	}

	function handleAddProduct(productData) {
		inventoryStore.addProduct(productData);
		inventoryStore.sync();
		showForm = false;
		showToast('Product saved');
	}

	function handleEditProduct(product) {
		editingProduct = { ...product };
		showForm = true;
	}

	function handleUpdateProduct(productData) {
		inventoryStore.updateProduct(editingProduct.id, {
			name: productData.name,
			category: productData.category,
			supplier: productData.supplier,
			wholesaleCost: productData.wholesaleCost,
			retailPrice: productData.retailPrice,
			stock: productData.stock,
			advertisedOn: productData.advertisedOn,
			notes: productData.notes,
			dateEntered: productData.dateEntered
		});
		inventoryStore.sync();
		editingProduct = null;
		showForm = false;
		showToast('Product saved');
	}

	function handleDeleteProduct(id) {
		inventoryStore.deleteProduct(id);
		inventoryStore.deleteFromRemote(id);
	}

	function handleCancel() {
		showForm = false;
		editingProduct = null;
	}
</script>

<div class="stock-container">
	<div class="controls">
		<button class="btn-new" onclick={() => { editingProduct = null; showForm = !showForm; }}>
			+ New product
		</button>

		<div class="search-filter">
			<input type="text" placeholder="Search..." bind:value={searchQuery} />
			<select bind:value={filterType}>
				<option value="dateDesc">Date: newest</option>
				<option value="dateAsc">Date: oldest</option>
				<option value="priceLow">Price: low–high</option>
				<option value="priceHigh">Price: high–low</option>
				<option value="supplier">By supplier</option>
			</select>
		</div>
	</div>

	{#if showForm}
		<ProductForm
			onsubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
			oncancel={handleCancel}
			editProduct={editingProduct}
		/>
	{/if}

	<div class="products-list">
		{#if filteredProducts.length === 0}
			<p class="empty-state">No products yet. Create your first one!</p>
		{:else}
			<ProductList
				products={filteredProducts}
				ondelete={handleDeleteProduct}
				onedit={handleEditProduct}
			/>
		{/if}
	</div>
</div>

{#if toastMessage}
	<div class="toast">{toastMessage}</div>
{/if}

<style>
	.stock-container {
		padding: 16px;
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 16px;
	}

	.btn-new {
		background: var(--dazzle);
		color: white;
		border: none;
		padding: 12px 16px;
		border-radius: 8px;
		font-weight: 600;
		font-size: var(--font-body);
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-new:active {
		background: #7a0054;
	}

	.search-filter {
		display: flex;
		gap: 8px;
	}

	.search-filter input,
	.search-filter select {
		flex: 1;
		padding: 10px 12px;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: var(--font-helper);
	}

	.products-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.empty-state {
		text-align: center;
		color: var(--text-helper);
		padding: 40px 20px;
		font-size: var(--font-helper);
	}

	.toast {
		position: fixed;
		bottom: 72px;
		left: 50%;
		transform: translateX(-50%);
		background: var(--dazzle);
		color: white;
		padding: 10px 24px;
		border-radius: 8px;
		font-size: var(--font-helper);
		font-weight: 500;
		z-index: 400;
		animation: fadeInOut 2.5s ease;
		pointer-events: none;
	}

	@keyframes fadeInOut {
		0% { opacity: 0; transform: translateX(-50%) translateY(8px); }
		15% { opacity: 1; transform: translateX(-50%) translateY(0); }
		80% { opacity: 1; }
		100% { opacity: 0; }
	}
</style>
